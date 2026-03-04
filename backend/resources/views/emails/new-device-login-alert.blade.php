<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;padding:20px 12px;background-color:#f3f6fb;">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#ffffff;border:1px solid #dbe4f0;border-radius:12px;">
        <tr>
          <td align="center" style="padding:26px 20px 14px 20px;">
                        <img src="https://i.ibb.co/nFLGYCy/logo.png" alt="Security icon" width="72" style="display:block;width:100%;max-width:72px;height:auto;border:0;outline:none;text-decoration:none;" />
          </td>
        </tr>
        <tr>
          <td style="padding:8px 24px 6px 24px;font-family:Arial,Helvetica,sans-serif;color:#10233f;text-align:center;">
            <div style="font-size:24px;line-height:32px;font-weight:700;">New device login detected</div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 16px 24px;font-family:Arial,Helvetica,sans-serif;color:#52637a;text-align:center;">
            <div style="font-size:16px;line-height:24px;">We noticed a login from a new device.</div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 18px 24px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #d8e2f1;border-radius:10px;">
              <tr>
                <td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;font-weight:700;color:#304764;width:38%;background-color:#f6f9ff;border-bottom:1px solid #d8e2f1;">Time</td>
                <td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#1d2a3f;border-bottom:1px solid #d8e2f1;">{{ $time }}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;font-weight:700;color:#304764;width:38%;background-color:#f6f9ff;border-bottom:1px solid #d8e2f1;">Device</td>
                <td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#1d2a3f;border-bottom:1px solid #d8e2f1;">{{ $device }}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;font-weight:700;color:#304764;width:38%;background-color:#f6f9ff;border-bottom:1px solid #d8e2f1;">Browser</td>
                <td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#1d2a3f;border-bottom:1px solid #d8e2f1;">{{ $browser }}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;font-weight:700;color:#304764;width:38%;background-color:#f6f9ff;border-bottom:1px solid #d8e2f1;">OS</td>
                <td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#1d2a3f;border-bottom:1px solid #d8e2f1;">{{ $os }}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;font-weight:700;color:#304764;width:38%;background-color:#f6f9ff;">IP</td>
                <td style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#1d2a3f;">{{ $ip }}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 24px 18px 24px;">
            <a href="{{ url('/forgot-password') }}" style="display:inline-block;background-color:#007bff;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:15px;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:8px;">Reset Password</a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 24px 28px 24px;font-family:Arial,Helvetica,sans-serif;color:#6a778c;text-align:center;">
            <div style="font-size:14px;line-height:21px;">If this was you, no action is needed. If you don't recognize this login, please reset your password immediately.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
