import nodemailer from "nodemailer";
import dotenv from "dotenv";
import handlebars from "handlebars";
import fs from "fs";

const forgotPasswordMail = async (
  token: string,
  email: string
): Promise<void> => {
  try {
    const url = "http://localhost:5173";
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      service: process.env.MAIL_SERVICE,
      port: 465,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });
    const emailTemplateSource = fs.readFileSync(
      "./src/views/forgotPassword.hbs",
      "utf-8"
    );
    const template = handlebars.compile(emailTemplateSource);
    const htmlToSend = template({
      urlorcode: `${url}/${token}`,
    });
    let info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: `${email}`,
      subject: "Reset your password",
      text: "Reset password",
      html: htmlToSend,
      // console.log("info--------------------------", info);
      // console.log("Message sent: %s************************", info.messageId);
    });
    console.log(
      "Preview URL: %s-------------------",
      nodemailer.getTestMessageUrl(info)
    );
  } catch (err) {
    console.log(err, "err-------------");
  }
};

const verifyEmail = async (email: string, token: string): Promise<void> => {
  try {
    const url = "http://localhost:5173/verifyEmail";
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      service: process.env.MAIL_SERVICE,
      port: 465,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });
    const emailTemplateSource = fs.readFileSync(
      "./src/views/verifyEmail.hbs",
      "utf-8"
    );
    const template = handlebars.compile(emailTemplateSource);
    const htmlToSend = template({
      urlorcode: `${url}/${token}`,
    });
    let info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: `${email}`,
      subject: "Verify your email",
      text: "Email verification",
      html: htmlToSend,
      // console.log("info--------------------------", info);
      // console.log("Message sent: %s************************", info.messageId);
    });
    console.log(
      "Preview URL: %s-------------------",
      nodemailer.getTestMessageUrl(info)
    );
  } catch (err: any) {
    console.log(err, "err-------------");
  }
};

export { forgotPasswordMail, verifyEmail };
