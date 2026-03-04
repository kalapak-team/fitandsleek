<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleVisionService
{
    private $projectId;
    private $credentialsPath;

    public function __construct()
    {
        $this->projectId = config('services.google_vision.project_id', 'fitandsleekpro');
        $this->credentialsPath = config('services.google_vision.credentials_path');
    }

    /**
     * Analyze image using Google Vision API
     * Supports both file uploads and image URLs
     */
    public function analyze($fileOrUrl)
    {
        try {
            // Prepare image data
            $isUrl = is_string($fileOrUrl) && preg_match('#^https?://#i', $fileOrUrl);
            
            if ($isUrl) {
                $image = ['source' => ['imageUri' => $fileOrUrl]];
            } else {
                $imageContent = base64_encode(file_get_contents($fileOrUrl->getRealPath()));
                $image = ['content' => $imageContent];
            }

            // Build Vision API request
            $payload = [
                'requests' => [
                    [
                        'image' => $image,
                        'features' => [
                            ['type' => 'TEXT_DETECTION', 'maxResults' => 1],
                            ['type' => 'LABEL_DETECTION', 'maxResults' => 10],
                            ['type' => 'IMAGE_PROPERTIES'],
                        ],
                    ],
                ],
            ];

            Log::info('[GoogleVisionService] Analyzing image', [
                'isUrl' => $isUrl,
                'url' => $isUrl ? $fileOrUrl : 'file_upload'
            ]);

            // Get access token and make request
            $token = $this->getAccessToken();
            if (!$token) {
                Log::error('[GoogleVisionService] Failed to get access token');
                return $this->errorResponse('Failed to authenticate with Google');
            }

            $response = Http::timeout(30)
                ->withToken($token)
                ->post("https://vision.googleapis.com/v1/projects/{$this->projectId}/images:annotate", $payload);

            Log::info('[GoogleVisionService] API Response Status:', ['status' => $response->status()]);

            if (!$response->successful()) {
                Log::error('[GoogleVisionService] API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return $this->errorResponse('Vision API request failed', $response->status());
            }

            // Extract results
            $data = $response->json();
            $result = $data['responses'][0] ?? [];

            // Extract text
            $text = $result['fullTextAnnotation']['text'] ?? '';
            
            // Extract labels
            $labels = collect($result['labelAnnotations'] ?? [])
                ->map(fn($label) => [
                    'description' => $label['description'] ?? '',
                    'score' => $label['score'] ?? 0,
                ])
                ->sortByDesc('score')
                ->pluck('description')
                ->values()
                ->all();

            // Extract colors
            $colors = collect($result['imagePropertiesAnnotation']['dominantColors']['colors'] ?? [])
                ->map(fn($color) => [
                    'color' => $color['color'] ?? [],
                    'score' => $color['score'] ?? 0,
                    'pixelFraction' => $color['pixelFraction'] ?? 0,
                ])
                ->sortByDesc('score')
                ->values()
                ->all();

            Log::info('[GoogleVisionService] Analysis Complete', [
                'textLength' => strlen($text),
                'labelCount' => count($labels),
                'colorCount' => count($colors),
            ]);

            return [
                'text' => trim($text),
                'labels' => $labels,
                'colors' => $colors,
            ];

        } catch (\Throwable $e) {
            Log::error('[GoogleVisionService] Exception', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return $this->errorResponse('Vision analysis failed: ' . $e->getMessage());
        }
    }

    /**
     * Get access token using service account credentials
     */
    private function getAccessToken()
    {
        if (!file_exists($this->credentialsPath)) {
            Log::error('[GoogleVisionService] Credentials file not found', [
                'path' => $this->credentialsPath
            ]);
            return null;
        }

        try {
            $credentials = json_decode(file_get_contents($this->credentialsPath), true);
            
            if (!$credentials || !isset($credentials['private_key'])) {
                Log::error('[GoogleVisionService] Invalid credentials format');
                return null;
            }

            // Create JWT assertion
            $now = time();
            $assertion = [
                'iss' => $credentials['client_email'],
                'scope' => 'https://www.googleapis.com/auth/cloud-platform',
                'aud' => $credentials['token_uri'],
                'exp' => $now + 3600,
                'iat' => $now,
            ];

            $jwt = $this->createJWT($assertion, $credentials['private_key']);

            // Exchange JWT for access token
            $tokenResponse = Http::timeout(10)->asForm()->post($credentials['token_uri'], [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            if (!$tokenResponse->successful()) {
                Log::error('[GoogleVisionService] Token request failed', [
                    'status' => $tokenResponse->status(),
                    'body' => $tokenResponse->body()
                ]);
                return null;
            }

            $token = $tokenResponse->json('access_token');
            Log::info('[GoogleVisionService] Access token acquired');
            return $token;

        } catch (\Throwable $e) {
            Log::error('[GoogleVisionService] Token generation failed', [
                'message' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Create JWT token for service account authentication
     */
    private function createJWT($payload, $privateKey)
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'RS256']);
        $payload = json_encode($payload);

        $headerEncoded = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
        $payloadEncoded = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');

        $signatureInput = $headerEncoded . '.' . $payloadEncoded;
        
        openssl_sign($signatureInput, $signature, $privateKey, 'sha256');
        $signatureEncoded = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

        return $signatureInput . '.' . $signatureEncoded;
    }

    /**
     * Return error response
     */
    private function errorResponse($message, $status = null)
    {
        return [
            'text' => '',
            'labels' => [],
            'colors' => [],
            'error' => true,
            'message' => $message,
            'status' => $status,
        ];
    }
}