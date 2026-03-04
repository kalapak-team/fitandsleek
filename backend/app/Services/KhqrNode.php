<?php

namespace App\Services;

use JsonException;
use RuntimeException;
use Symfony\Component\Process\Process as SymfonyProcess;

class KhqrNode
{
    public function generate(array $data): array
    {
        $script = base_path('node-khqr/generate.mjs');

        if (! is_file($script)) {
            throw new RuntimeException('KHQR generator script not found.');
        }

        try {
            $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new RuntimeException('Failed to encode KHQR payload: ' . $e->getMessage(), 0, $e);
        }

        $nodeBinary = $this->resolveNodeBinary();

        $process = new SymfonyProcess([$nodeBinary, $script, $json], dirname($script), null, null, 30);
        $process->run();

        if (! $process->isSuccessful()) {
            $stderr = trim($process->getErrorOutput());
            $stdout = trim($process->getOutput());
            $details = $stderr !== '' ? $stderr : $stdout;
            $exitCode = $process->getExitCode();
            $exitText = $process->getExitCodeText();

            throw new RuntimeException(sprintf(
                'Node KHQR generator failed (bin=%s, exit=%s %s): %s',
                $nodeBinary,
                $exitCode ?? 'null',
                $exitText ?? '',
                $details !== '' ? $details : 'Unknown error'
            ));
        }

        $decoded = json_decode(trim($process->getOutput()), true);

        if (! is_array($decoded) || empty($decoded['qr']) || empty($decoded['md5'])) {
            throw new RuntimeException('Invalid KHQR output: ' . $process->getOutput());
        }

        return [
            'qr' => $decoded['qr'],
            'md5' => $decoded['md5'],
        ];
    }

    private function resolveNodeBinary(): string
    {
        $configured = trim((string) config('services.bakong.node_binary', 'node'));

        if ($configured !== '') {
            return $configured;
        }

        return 'node';
    }
}
