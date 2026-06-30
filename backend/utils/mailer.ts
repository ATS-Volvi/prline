import nodemailer from 'nodemailer'
import { variables } from '../config/envLoader'
import AnotherError from './errors/anotherError'
import express from 'express'
import { createError } from './errors/createError'

export const sendEmail = async (reciever: string, subject: string, body: string, next?: express.NextFunction): Promise<boolean> => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: variables.WORKSPACE_EMAIL,
      pass: variables.WORKSPACE_PASSWORD,
    },
    tls: {
      rejectUnauthorized: true,
    },
  })
  const hasHTMLTags = /<[a-z][\s\S]*>/i.test(body)
  const mailOptions = {
    from: variables.WORKSPACE_EMAIL,
    to: reciever,
    subject: subject,
    text: body,
    ...(hasHTMLTags ? { html: body } : {}),
  }
  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Message sent: %s', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}