import "server-only";
import { Resend } from "resend";

// Sin un dominio propio verificado en Resend, la cuenta "sandbox" sólo
// puede mandar correos al dueño de la cuenta de Resend (no a cualquier
// destinatario) — restricción de ellos, no nuestra. Cuando haya un dominio
// propio, verificarlo en Resend y cambiar EMAIL_FROM a una dirección de
// ese dominio (ej. "Liga AEFPY <noreply@ligaaefpy.com>") habilita mandarle
// a cualquiera.
const FROM_ADDRESS = process.env.EMAIL_FROM || "Liga AEFPY <onboarding@resend.dev>";

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Manda el correo de "olvidé mi contraseña". Si RESEND_API_KEY no está
 * configurada, o el envío falla, no rompe el flujo (requestPasswordResetAction
 * igual muestra el mensaje genérico de éxito) — sólo queda logueado acá,
 * para que un problema de configuración de email no delate qué correos
 * existen ni tire un error confuso al usuario.
 */
export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
  const client = getClient();
  if (!client) {
    console.error("[email] RESEND_API_KEY no está configurada — no se pudo enviar el correo de recuperación.");
    return;
  }

  try {
    const { error } = await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Recuperar tu contraseña — Liga AEFPY",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0b1b3f;">Recuperar tu contraseña</h2>
          <p>Hola ${name},</p>
          <p>Pediste restablecer la contraseña de tu cuenta en el panel de administración de Liga AEFPY. Hacé clic en el siguiente botón para elegir una nueva:</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background: #c81729; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Elegir nueva contraseña</a>
          </p>
          <p style="color: #6b7280; font-size: 13px;">Este enlace vale por 1 hora y sólo se puede usar una vez. Si no fuiste vos quien lo pidió, podés ignorar este correo — tu contraseña actual sigue funcionando.</p>
        </div>
      `,
    });
    if (error) {
      console.error("[email] Resend devolvió un error:", error);
    }
  } catch (error) {
    console.error("[email] Falló el envío del correo de recuperación:", error);
  }
}
