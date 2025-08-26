/* eslint-disable no-console */
require("dotenv").config();
const amqp = require("amqplib");

const ExportsService = require("./ExportsService");
const MailSender = require("./MailSender");
const Listener = require("./listener");

const start = async () => {
  const rabbitUrl = process.env.RABBITMQ_SERVER;
  if (!rabbitUrl) {
    throw new Error("RABBITMQ_SERVER env is required");
  }

  const connection = await amqp.connect(rabbitUrl);
  connection.on("error", (e) =>
    console.error("[RabbitMQ] connection error:", e)
  );
  connection.on("close", () => console.warn("[RabbitMQ] connection closed"));

  const channel = await connection.createChannel();

  const exportsService = new ExportsService();
  const mailSender = new MailSender();
  const listener = new Listener(channel, exportsService, mailSender);

  await listener.listen("export:playlists");

  process.on("SIGINT", async () => {
    console.log("Shutting down consumer...");
    try {
      await exportsService.close();
      await channel.close();
      await connection.close();
    } catch (e) {
      console.error("Error shutting down:", e);
    } finally {
      process.exit(0);
    }
  });
};

start().catch((e) => {
  console.error("Fatal consumer error:", e);
  process.exit(1);
});
