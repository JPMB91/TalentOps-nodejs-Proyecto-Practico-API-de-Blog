const nodemailer = require("nodemailer");

let transporter = null;

async function initTransporter() {
  if (!transporter) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  return transporter
}

async function sendEmail(post) {
  try {
    const transport = await initTransporter();

   const info = await transport.sendMail({
      from: '"Blog API" <noreply@blog.com>',
      to: "admin@example.com",
      subject: `Post publicado: ${post.titulo}`,
      html: `
            <h2>Nuevo post publicado</h2>
            <h3>${post.titulo}</h3>
            <p>${post.contenido.substring(0, 200)}...</p>
            <a href="http://localhost:3000/posts/${post.id}">Leer más</a>
          `,
    });
    console.log("Correo Enviado: ");
    console.log("Correo en:", nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error) {
    console.error("Error Enviando correo: ", error);
  }
}

module.exports = sendEmail;
