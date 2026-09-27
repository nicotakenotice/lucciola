import { AUTO, Game, Scale } from 'phaser';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Game as MainGame } from './scenes/Game';
import { HEIGHT, WIDTH } from './constants';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent: 'game-container',
    backgroundColor: '#020308',
    // L'audio è tutto sintetizzato in audio.ts: il sound manager di Phaser non serve
    audio: {
        noAudio: true
    },
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Menu,
        MainGame
    ]
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
