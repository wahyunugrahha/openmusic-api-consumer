const { Pool } = require("pg");

class ExportsService {
  constructor() {
    this._pool = new Pool(); 
  }

  async buildPlaylistExportJson(playlistId) {
    // Detail playlist
    const playlistQuery = {
      text: `SELECT id, name FROM playlists WHERE id = $1`,
      values: [playlistId],
    };
    const playlistRes = await this._pool.query(playlistQuery);
    if (!playlistRes.rowCount) {
      throw new Error(`Playlist ${playlistId} tidak ditemukan`);
    }
    const playlist = playlistRes.rows[0];

    // Lagu-lagu dalam playlist
    const songsQuery = {
      text: `
        SELECT s.id, s.title, s.performer
        FROM songs s
        JOIN playlist_songs ps ON ps.song_id = s.id
        WHERE ps.playlist_id = $1
        ORDER BY ps.created_at ASC, s.title ASC
      `,
      values: [playlistId],
    };
    const songsRes = await this._pool.query(songsQuery);

    const result = {
      playlist: {
        id: playlist.id,
        name: playlist.name,
        songs: songsRes.rows.map((r) => ({
          id: r.id,
          title: r.title,
          performer: r.performer,
        })),
      },
    };

    return result;
  }

  async close() {
    await this._pool.end();
  }
}

module.exports = ExportsService;
