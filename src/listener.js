class Listener {
  constructor(channel, exportsService, mailSender) {
    this._ch = channel;
    this._exportsService = exportsService;
    this._mailSender = mailSender;

    this.listen = this.listen.bind(this);
  }

  async listen(queueName = "export:playlists") {
    await this._ch.assertQueue(queueName, { durable: true });
    this._ch.prefetch(1);

    console.log(`[Consumer] Waiting for messages in ${queueName}`);

    this._ch.consume(
      queueName,
      async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          const { playlistId, targetEmail } = content;

          if (!playlistId || !targetEmail) {
            throw new Error(
              "Invalid message: playlistId & targetEmail required"
            );
          }

          const exportJson = await this._exportsService.buildPlaylistExportJson(
            playlistId
          );

          await this._mailSender.sendExportEmail(
            targetEmail,
            playlistId,
            exportJson
          );

          this._ch.ack(msg);
          console.log(
            `[Consumer] Export sent for playlist ${playlistId} -> ${targetEmail}`
          );
        } catch (err) {
          console.error("[Consumer] Error processing message:", err);
          this._ch.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
  }
}

module.exports = Listener;
