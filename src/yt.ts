import ffmpeg from "fluent-ffmpeg";
import ffmpegForVideo from "ffmpeg-static";
import fs from "fs";
import { Client, Message, MessageMedia } from "whatsapp-web.js";
import ytdl from "@distube/ytdl-core";
import cp from "child_process";
import { download, checkAndUnlink } from "./utils";

export const onAudio = async (
  ytLink: string,
  client: Client,
  toChat: string,
  msgForID: Message
) => {
  const universalName = msgForID.id.id;
  try {
    let thumbnailDownloaded = false;
    const info = await ytdl.getInfo(ytLink);
    let title = info?.videoDetails?.title.replace(/\s+/g, "_").trim();
    fs.writeFileSync(`./db/${universalName}.mp3`, "");
    fs.writeFileSync(`./db/${universalName}1.mp3`, "");
    const audioStream = ytdl(ytLink, {
      filter: "audioonly",
      quality: "highestaudio",
    });
    const metadata = {
      title:
        info?.videoDetails?.title?.replace(/\s+/g, "_").trim() ?? "Unknown",
      artist:
        info?.videoDetails?.author?.name?.replace(/\s+/g, "_").trim() ??
        "Unknown",
      year: info?.player_response?.microformat?.playerMicroformatRenderer?.publishDate?.substring(
        0,
        4
      ),
      genre: "Unknown",
    };
    const thumbnailurl =
      info?.player_response?.microformat?.playerMicroformatRenderer?.thumbnail
        .thumbnails[0].url;
    if (thumbnailurl) {
      fs.writeFileSync(`./db/${universalName}.jpg`, "");
      download(thumbnailurl, `./db/${universalName}.jpg`, function () {
        thumbnailDownloaded = true;
      });
    }
    ffmpeg(audioStream)
      .audioBitrate(320)
      .toFormat("mp3")
      .saveToFile(`./db/${universalName}.mp3`)
      .on("end", async () => {
        if (thumbnailDownloaded) {
          ffmpeg()
            .input(`./db/${universalName}.mp3`)
            .input(`./db/${universalName}.jpg`)
            .outputOptions([
              "-map 0:0",
              "-map 1:0",
              "-c copy",
              "-id3v2_version 3",
              `-metadata:s:v title=\"Album_cover\"`,
              `-metadata:s:v comment=\"Cover_(front)\"`,
              `-metadata`,
              `title=${metadata.title}`,
              `-metadata`,
              `artist=${metadata.artist}`,
              `-metadata`,
              `date=${metadata.year}`,
              `-metadata`,
              `genre=${metadata.genre}`,
            ])
            .output(`./db/${universalName}1.mp3`)
            .on("end", async () => {
              const mp3 = MessageMedia.fromFilePath(
                `./db/${universalName}1.mp3`
              );
              mp3.filename = `${title}.mp3`;
              await client
                .sendMessage(toChat, mp3, { sendMediaAsDocument: true })
                .then(async (sent) => {
                  sent.react("✅");
                  msgForID.react("✅");
                  checkAndUnlink(`./db/${universalName}.mp3`);
                  checkAndUnlink(`./db/${universalName}1.mp3`);
                  checkAndUnlink(`./db/${universalName}.jpg`);
                })
                .catch(async (err) => {
                  console.log("Sending audio", err);
                  msgForID.react("❌");
                  await client.sendMessage(toChat, "Try again");
                  checkAndUnlink(`./db/${universalName}.mp3`);
                  checkAndUnlink(`./db/${universalName}1.mp3`);
                  checkAndUnlink(`./db/${universalName}.jpg`);
                });
            })
            .on("error", function (err, stdout, stderr) {
              console.error("An error occurred: " + err.message);
              console.error("FFmpeg stdout: " + stdout);
              console.error("FFmpeg stderr: " + stderr);
              checkAndUnlink(`./db/${universalName}.mp3`);
              checkAndUnlink(`./db/${universalName}1.mp3`);
              checkAndUnlink(`./db/${universalName}.jpg`);
            })
            .run();
        } else {
          ffmpeg()
            .input(`./db/${universalName}.mp3`)
            .input(`./db/${universalName}.jpg`)
            .outputOptions([
              "-c copy",
              "-id3v2_version 3",
              `-metadata`,
              `title=${metadata.title}`,
              `-metadata`,
              `artist=${metadata.artist}`,
              `-metadata`,
              `date=${metadata.year}`,
              `-metadata`,
              `genre=${metadata.genre}`,
            ])
            .output(`./db/${universalName}1.mp3`)
            .on("end", async () => {
              const mp3 = MessageMedia.fromFilePath(
                `./db/${universalName}1.mp3`
              );
              mp3.filename = title;
              await client
                .sendMessage(toChat, mp3, { sendMediaAsDocument: true })
                .then(async (sent) => {
                  sent.react("✅");
                  msgForID.react("✅");
                  checkAndUnlink(`./db/${universalName}.mp3`);
                  checkAndUnlink(`./db/${universalName}1.mp3`);
                  checkAndUnlink(`./db/${universalName}.jpg`);
                })
                .catch(async (err) => {
                  console.log("Sending audio", err);
                  msgForID.react("❌");
                  await client.sendMessage(toChat, "Try again");
                  checkAndUnlink(`./db/${universalName}.mp3`);
                  checkAndUnlink(`./db/${universalName}1.mp3`);
                  checkAndUnlink(`./db/${universalName}.jpg`);
                });
            })
            .on("error", function (err, stdout, stderr) {
              console.error("An error occurred: " + err.message);
              console.error("FFmpeg stdout: " + stdout);
              console.error("FFmpeg stderr: " + stderr);
              checkAndUnlink(`./db/${universalName}.mp3`);
              checkAndUnlink(`./db/${universalName}1.mp3`);
              checkAndUnlink(`./db/${universalName}.jpg`);
            })
            .run();
        }
      })
      .on("error", (error) => {
        checkAndUnlink(`./db/${universalName}.mp3`);
        checkAndUnlink(`./db/${universalName}1.mp3`);
        checkAndUnlink(`./db/${universalName}.jpg`);
        console.log("ffmpeg", error);
      });
  } catch (error) {
    checkAndUnlink(`./db/${universalName}.mp3`);
    checkAndUnlink(`./db/${universalName}1.mp3`);
    checkAndUnlink(`./db/${universalName}.jpg`);
    console.log("Some error YTAUDIO: ", error);
  }
};

export const onVideo = async (
  ytLink: string,
  client: Client,
  toChat: Message,
  msgForID: Message
) => {
  const universalName = msgForID.id.id;
  try {
    const tracker = {
      start: Date.now(),
      audio: { downloaded: 0, total: Infinity },
      video: { downloaded: 0, total: Infinity },
      merged: { frame: 0, speed: "0x", fps: 0 },
    };

    const audio = ytdl(ytLink, { quality: "highestaudio" }).on(
      "progress",
      (_, downloaded, total) => {
        tracker.audio = { downloaded, total };
      }
    );
    const video = ytdl(ytLink, { quality: "highestvideo" }).on(
      "progress",
      (_, downloaded, total) => {
        tracker.video = { downloaded, total };
      }
    );

    const ffmpegProcess = cp.spawn(
      ffmpegForVideo as string,
      [
        "-loglevel",
        "8",
        "-hide_banner",
        "-progress",
        "pipe:3",
        "-i",
        "pipe:4",
        "-i",
        "pipe:5",
        "-map",
        "0:a",
        "-map",
        "1:v",
        "-c:v",
        "copy",
        `./db/${universalName}.mkv`,
      ],
      {
        windowsHide: true,
        stdio: ["inherit", "inherit", "inherit", "pipe", "pipe", "pipe"],
      }
    );

    ffmpegProcess.on("close", () => {
      const convertProcess = cp.spawn(ffmpegForVideo as string, [
        "-i",
        `./db/${universalName}.mkv`,
        "-c",
        "copy",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        `./db/${universalName}.mp4`,
      ]);
      convertProcess.on("exit", async () => {
        const info = await ytdl.getInfo(ytLink);
        let title = info?.videoDetails?.title.replace(/\s+/g, "_").trim();
        const tracks =
          info?.player_response?.captions?.playerCaptionsTracklistRenderer
            ?.captionTracks;
        const format = "vtt";
        if (tracks && tracks.length) {
          const track = tracks.find((t) => t.languageCode === "en");
          if (track) {
            const output = `${info.videoDetails.title}.${track.languageCode}.${format}`;
            fs.writeFileSync(`./db/${universalName}.vtt`, "");
            fs.writeFileSync(`./db/${universalName}1.mp4`, "");
            download(
              `${track.baseUrl}&fmt=${format}`,
              `./db/${universalName}.vtt`,
              function () {
                ffmpeg(`./db/${universalName}.mp4`)
                  .inputFormat("mp4")
                  .input(`./db/${universalName}.vtt`)
                  .outputOptions(
                    "-c:v",
                    "copy",
                    "-c:a",
                    "copy",
                    "-c:s",
                    "mov_text",
                    "-metadata:s:s:0",
                    "language=eng",
                    "-metadata:s:s:0",
                    'title="English"',
                    "-disposition:s:0",
                    "forced"
                  )
                  .output(`./db/${universalName}1.mp4`)
                  .on("error", (error, stdout, stderr) => {
                    console.error(
                      `Failed to merge video and subtitles: ${error}`
                    );
                  })
                  .on("end", async () => {
                    const mp4 = MessageMedia.fromFilePath(
                      `./db/${universalName}1.mp4`
                    );
                    mp4.filename = `${title}.mp4`;
                    await client
                      .sendMessage(toChat.id.id, mp4, {
                        sendMediaAsDocument: true,
                      })
                      .then(async (sent) => {
                        sent.react("✅");
                        msgForID.react("✅");
                        checkAndUnlink(`./db/${universalName}.mkv`);
                        checkAndUnlink(`./db/${universalName}1.mp4`);
                        checkAndUnlink(`./db/${universalName}.mp4`);
                        checkAndUnlink(`./db/${universalName}.vtt`);
                        // await globalThis.ytReplied.delete(true);
                      })
                      .catch(async (err) => {
                        console.log("Sending audio", err);
                        msgForID.react("❌");
                        await client.sendMessage(toChat.id.id, "Try again");
                        checkAndUnlink(`./db/${universalName}.mkv`);
                        checkAndUnlink(`./db/${universalName}1.mp4`);
                        checkAndUnlink(`./db/${universalName}.mp4`);
                        checkAndUnlink(`./db/${universalName}.vtt`);
                      });
                  })
                  .run();
              }
            );
          } else {
            const mp4 = MessageMedia.fromFilePath(`./db/${universalName}.mp4`);
            mp4.filename = `${title}.mp4`;
            await client
              .sendMessage(toChat.id.id, mp4, { sendMediaAsDocument: true })
              .then(async (sent) => {
                sent.react("✅");
                msgForID.react("✅");
                checkAndUnlink(`./db/${universalName}.mkv`);
                checkAndUnlink(`./db/${universalName}.mp4`);
                checkAndUnlink(`./db/${universalName}.vtt`);
                // await globalThis.ytReplied.delete(true);
              })
              .catch(async (err) => {
                console.log("Sending audio", err);
                msgForID.react("❌");
                await client.sendMessage(toChat.id.id, "Try again");
                checkAndUnlink(`./db/${universalName}.mkv`);
                checkAndUnlink(`./db/${universalName}.mp4`);
                checkAndUnlink(`./db/${universalName}.vtt`);
              });
          }
        } else {
          const mp4 = MessageMedia.fromFilePath(`./db/${universalName}.mp4`);
          mp4.filename = `${title}.mp4`;
          await client
            .sendMessage(toChat.id.id, mp4, { sendMediaAsDocument: true })
            .then(async (sent) => {
              sent.react("✅");
              msgForID.react("✅");
              checkAndUnlink(`./db/${universalName}.mkv`);
              checkAndUnlink(`./db/${universalName}.mp4`);
              checkAndUnlink(`./db/${universalName}.vtt`);
              // await globalThis.ytReplied.delete(true);
            })
            .catch(async (err) => {
              console.log("Sending audio", err);
              msgForID.react("❌");
              await client.sendMessage(toChat.id.id, "Try again");
              checkAndUnlink(`./db/${universalName}.mkv`);
              checkAndUnlink(`./db/${universalName}.mp4`);
              checkAndUnlink(`./db/${universalName}.vtt`);
            });
        }
      });
    });

    ffmpegProcess.stdio[3]?.on("data", (chunk) => {
      const lines = chunk.toString().trim().split("\n");
      const args: { [key: string]: string } = {};
      for (const l of lines) {
        const [key, value] = l.split("=");
        args[key.trim()] = value.trim();
      }
      tracker.merged = args as any;
    });

    audio.pipe(ffmpegProcess.stdio[3] as NodeJS.WritableStream);
    video.pipe(ffmpegProcess.stdio[4] as NodeJS.WritableStream);
  } catch (error) {
    console.log("YT video: ", error);
  }
};
