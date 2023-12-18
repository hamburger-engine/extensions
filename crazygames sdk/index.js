/*
   This extension was made with TurboBuilder!
   https://turbobuilder-steel.vercel.app/
*/
(function(Scratch) {
    const variables = {};
    const blocks = [];
    const menus = [];


    function doSound(ab, cd, runtime) {
        const audioEngine = runtime.audioEngine;

        const fetchAsArrayBufferWithTimeout = (url) =>
            new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                let timeout = setTimeout(() => {
                    xhr.abort();
                    reject(new Error("Timed out"));
                }, 5000);
                xhr.onload = () => {
                    clearTimeout(timeout);
                    if (xhr.status === 200) {
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`HTTP error ${xhr.status} while fetching ${url}`));
                    }
                };
                xhr.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error(`Failed to request ${url}`));
                };
                xhr.responseType = "arraybuffer";
                xhr.open("GET", url);
                xhr.send();
            });

        const soundPlayerCache = new Map();

        const decodeSoundPlayer = async (url) => {
            const cached = soundPlayerCache.get(url);
            if (cached) {
                if (cached.sound) {
                    return cached.sound;
                }
                throw cached.error;
            }

            try {
                const arrayBuffer = await fetchAsArrayBufferWithTimeout(url);
                const soundPlayer = await audioEngine.decodeSoundPlayer({
                    data: {
                        buffer: arrayBuffer,
                    },
                });
                soundPlayerCache.set(url, {
                    sound: soundPlayer,
                    error: null,
                });
                return soundPlayer;
            } catch (e) {
                soundPlayerCache.set(url, {
                    sound: null,
                    error: e,
                });
                throw e;
            }
        };

        const playWithAudioEngine = async (url, target) => {
            const soundBank = target.sprite.soundBank;

            let soundPlayer;
            try {
                const originalSoundPlayer = await decodeSoundPlayer(url);
                soundPlayer = originalSoundPlayer.take();
            } catch (e) {
                console.warn(
                    "Could not fetch audio; falling back to primitive approach",
                    e
                );
                return false;
            }

            soundBank.addSoundPlayer(soundPlayer);
            await soundBank.playSound(target, soundPlayer.id);

            delete soundBank.soundPlayers[soundPlayer.id];
            soundBank.playerTargets.delete(soundPlayer.id);
            soundBank.soundEffects.delete(soundPlayer.id);

            return true;
        };

        const playWithAudioElement = (url, target) =>
            new Promise((resolve, reject) => {
                const mediaElement = new Audio(url);

                mediaElement.volume = target.volume / 100;

                mediaElement.onended = () => {
                    resolve();
                };
                mediaElement
                    .play()
                    .then(() => {
                        // Wait for onended
                    })
                    .catch((err) => {
                        reject(err);
                    });
            });

        const playSound = async (url, target) => {
            try {
                if (!(await Scratch.canFetch(url))) {
                    throw new Error(`Permission to fetch ${url} denied`);
                }

                const success = await playWithAudioEngine(url, target);
                if (!success) {
                    return await playWithAudioElement(url, target);
                }
            } catch (e) {
                console.warn(`All attempts to play ${url} failed`, e);
            }
        };

        playSound(ab, cd)
    }
    class Extension {
        getInfo() {
            return {
                "blockIconURI": "data:image/png;base64,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",
                "id": "extensionID",
                "name": "Extension",
                "docsURI": "https://docs.crazygames.com/sdk/html5/intro/",
                "color1": "#0088ff",
                "color2": "#0063ba",
                "tbShow": true,
                "blocks": blocks
            }
        }
    }
    blocks.push({
        opcode: `idk`,
        blockType: Scratch.BlockType.REPORTER,
        text: `ad error?`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`idk`] = (args, util) => {
        adError: (error, errorData) => console.log("Error rewarded ad (callback)", error, errorData),
        ;
    };

    (() => {
        const js_thml = () => {
            let code = "";
            code += "<script src=\"https://sdk.crazygames.com/crazygames-sdk-v2.js\"><\\/script>\n";
            return code;
        }
        document.getElementById("js_html").innerText = js_thml();
        document.getElementById("html-text").value = js_thml();;
        window.CrazyGames.SDK.game;;
    })();

    blocks.push({
        opcode: `bruh`,
        blockType: Scratch.BlockType.REPORTER,
        text: `ad started?`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`bruh`] = (args, util) => {
        adStarted: () => console.log("Start rewarded ad (callback)"),
        ;
    };

    blocks.push({
        opcode: `token`,
        blockType: Scratch.BlockType.BOOLEAN,
        text: `user token`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`token`] = (args, util) => {
        try {
            const token = await window.CrazyGames.SDK.user.getUserToken();
            console.log("Get token result", token);
        } catch (e) {
            console.log("Error:", e);
        };
    };

    blocks.push({
        opcode: `auth`,
        blockType: Scratch.BlockType.COMMAND,
        text: `show auth prompt`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`auth`] = (args, util) => {
        try {
            const user = await window.CrazyGames.SDK.user.showAuthPrompt();
            console.log("Auth prompt result", user);
        } catch (e) {
            console.log("Error:", e);
        };
    };

    blocks.push({
        opcode: `user`,
        blockType: Scratch.BlockType.BOOLEAN,
        text: `crazygames username`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`user`] = (args, util) => {
        const user = await window.CrazyGames.SDK.user.getUser();
        console.log("Get user result", user);;
    };

    blocks.push({
        opcode: `play`,
        blockType: Scratch.BlockType.REPORTER,
        text: `gameplay resumed?`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`play`] = (args, util) => {
        window.CrazyGames.SDK.game.gameplayStart();;
    };

    blocks.push({
        opcode: `pause`,
        blockType: Scratch.BlockType.REPORTER,
        text: `gameplay paused?`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`pause`] = (args, util) => {
        window.CrazyGames.SDK.game.gameplayStop();;
    };

    blocks.push({
        opcode: `hide invite`,
        blockType: Scratch.BlockType.COMMAND,
        text: `hide invite link`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`hide invite`] = (args, util) => {
        window.CrazyGames.SDK.game.hideInviteButton();;
    };

    blocks.push({
        opcode: `invite`,
        blockType: Scratch.BlockType.COMMAND,
        text: `invite link pop up`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`invite`] = (args, util) => {
        const callback = (error, link) => {
            if (error) {
                console.log("Invite link error (callback)", error);
            } else {
                console.log("Invite link (callback)", link);
            }
        };
        window.CrazyGames.SDK.game.inviteLink({
            roomId: 12345,
            param2: "value",
            param3: "value"
        }, callback);;
    };

    blocks.push({
        opcode: `loaded`,
        blockType: Scratch.BlockType.REPORTER,
        text: `when game loaded`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`loaded`] = (args, util) => {
        window.CrazyGames.SDK.game.sdkGameLoadingStop();;
    };

    blocks.push({
        opcode: `bye`,
        blockType: Scratch.BlockType.COMMAND,
        text: `delete all ad banners`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`bye`] = (args, util) => {
        window.CrazyGames.SDK.banner.clearAllBanners();;
    };

    blocks.push({
        opcode: `oi mate`,
        blockType: Scratch.BlockType.COMMAND,
        text: `play ad`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`oi mate`] = (args, util) => {
        window.CrazyGames.SDK.ad.requestAd("rewarded", callbacks);;
    };

    blocks.push({
        opcode: `load`,
        blockType: Scratch.BlockType.REPORTER,
        text: `game started loading?`,
        arguments: {
            window.CrazyGames.SDK.game.sdkGameLoadingStart();;
        },
        disableMonitor: true
    });
    Extension.prototype[`load`] = (args, util) => {};

    blocks.push({
        opcode: `banner`,
        blockType: Scratch.BlockType.COMMAND,
        text: `create ad banner`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`banner`] = (args, util) => {
        const js_thml = () => {
            let code = "";
            code += "<div id=\"banner-container\" style=\"width: 300px; height: 250px\"></div>\n";
            return code;
        }
        document.getElementById("js_html").innerText = js_thml();
        document.getElementById("html-text").value = js_thml();
        window.CrazyGames.SDK.banner.requestBanner({
            id: "banner-container",
            width: 300,
            height: 250,
        });;
    };

    blocks.push({
        opcode: `reward after ad`,
        blockType: Scratch.BlockType.REPORTER,
        text: `On Ad End`,
        arguments: {},
        disableMonitor: true
    });
    Extension.prototype[`reward after ad`] = (args, util) => {
        adFinished: () => console.log("End rewarded ad (callback)"),
        ;
    };

    Scratch.extensions.register(new Extension());
})(Scratch);