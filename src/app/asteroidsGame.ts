import { SaucerManager } from './managers/saucerManager';

import P5, { Vector } from 'p5';

import { ScoresManager } from './managers/scoreManager';
import { TextManager } from './managers/textManager';
import { ExplosionManager } from './managers/explosionManager';
import { PlayerShipManager, ShipTurn } from './managers/playerShipManager';
import { sketch } from "./p5-sketch";
import * as ConfigData from '../assets/config.json' 
import { IModel } from "./actors/base/actor";
import { AsteroidsManager } from './managers/asteroidsManager';
import { Manager } from './managers/manager';
import { InitialGameState } from "./gameStates/InitialGameState";
import { GameState } from "./gameStates/GameState";

export class ScreenSize {
  width:number;
  height:number;
  center:Vector;
}

export interface ISettings {
  lives:number;
  extraLife:number;
}

export enum Keys {
  RIGHT_ARROW,
  LEFT_ARROW,
  UP_ARROW,
  SPACE,
  RIGHT_CTRL
}

export class AsteroidsGame {
  screenSize:ScreenSize;
  playerManager:PlayerShipManager;
  asteroidsManager: AsteroidsManager;
  explosionsManager: ExplosionManager;
  managers:Manager[]=[];
  textManager: TextManager;
  scoresManager:ScoresManager;
  settings:ISettings;
  configData:typeof ConfigData;
  elapsedTime:number=0;
  gameState:GameState
  timers:GameTimer[]=[];



  private _ge:P5;
  private _prevElapsed = 0; 
  private _keyMapper:Map<number,Keys>=new Map();
  saucerManager: SaucerManager;

  constructor() {
    new P5((p5) => sketch(p5, this.setup));
  }

  public setup = (p5: P5) => {
    this._ge=p5;
    this.configData=ConfigData;
    // Creating canvas
    const scr_reduction = 0.8;
    const canvas = p5.createCanvas(
      p5.windowWidth * scr_reduction,
      p5.windowHeight * scr_reduction
    );
    canvas.parent("app");

    this._keyMapper=new Map([
      [p5.LEFT_ARROW,Keys.LEFT_ARROW],
      [p5.RIGHT_ARROW,Keys.RIGHT_ARROW],
      [p5.UP_ARROW,Keys.UP_ARROW],
      [32,Keys.SPACE],
      [p5.CONTROL,Keys.RIGHT_CTRL]
    ]);

    this._prevElapsed = p5.millis();

    // Redirect sketch functions
    p5.draw = () => this.gameLoop();
    p5.keyPressed = () => this.keyPressed(p5);
    p5.keyReleased = () => this.keyReleased(p5);

    this.screenSize=<ScreenSize>{width:p5.width,height:p5.height,center:p5.createVector(p5.width/2,p5.height/2)}
    
    // setup managers
    this.playerManager=new PlayerShipManager(this);
    //this.playerManager.createShip();
    this.asteroidsManager=new AsteroidsManager(this);
    //this.asteroidsManager.createAsteroids(10);
    this.explosionsManager=new ExplosionManager(this);
    this.textManager=new TextManager(this);
    this.scoresManager=new ScoresManager(this);
    this.saucerManager=new SaucerManager(this);
    this.managers.push(...[this.playerManager,
      this.asteroidsManager,
      this.explosionsManager, 
      this.textManager,
      this.scoresManager,
      this.saucerManager
    ])

    this.gameState=new InitialGameState(this);
  };

  public keyPressed = (p5: P5) => {
    const key=this._keyMapper.get(p5.keyCode);
    this.gameState.handleKeyPress(key)
  };

  public keyReleased = (p5: P5) => {
    const key=this._keyMapper.get(p5.keyCode);
    this.gameState.handleKeyRelease(key)
  };


  public gameLoop = () => {
    const timeDelta = this.getTimeDelta();

    this._ge.background(0);

    this.timers.forEach(timer=>timer.update(timeDelta));

    this.gameState.update(timeDelta);

    this.managers.forEach(manager => {
      manager.update(timeDelta);
      this._ge.push();
      manager.render();
      this._ge.pop();
    });

    this._ge.stroke("white");
    //this._ge.textSize(20);
    //this._ge.text((1000/timeDelta).toFixed(2).toString(),this._ge.width/2,this._ge.height);

  };

  public drawClosedShape(model:IModel) {
    this._ge.noFill();
    this._ge.beginShape();
    model.vertexes.forEach(v=>{
      this._ge.vertex(v[0],v[1]);
    })
    this._ge.endShape(this._ge.CLOSE);
  }

  public drawVerticedShape(model:IModel) {
    model.vertices.forEach((v) => {
      const vx1 = model.vertexes[v[0]];
      const vx2 = model.vertexes[v[1]];
      this._ge.line(vx1[0], vx1[1], vx2[0], vx2[1]);
    })
  }
  public drawPoint(x:number,y:number) {
    this._ge.strokeWeight(2);
    this._ge.point(x,y);
  }

  private getTimeDelta() {
    this.elapsedTime=Math.trunc(this._ge.millis());
    const timeDelta = this.elapsedTime - this._prevElapsed;
    this._prevElapsed = this.elapsedTime
    return timeDelta;
  }

  public random(max:number) {
    return this._ge.random(0,max);
  }

  public randomRange(min:number,max:number) {
    return this._ge.random(min,max);
  }

  public createTimer(time:number, callback?:()=>void):GameTimer {
    const timer=new GameTimer(time,callback);
    this.timers.push(timer);
    return timer;
  }

  public getRandomScreenPosition(constraintPct:number):Vector {
    const widthConstraint=this.screenSize.width*constraintPct;
    const heightConstraint=this.screenSize.height*constraintPct;
    return new Vector().set(this.randomRange(widthConstraint,this.screenSize.width-widthConstraint),this.randomRange(heightConstraint,this.screenSize.height-heightConstraint))
  }
}

export class GameTimer {
  protected _countDown:number;
  protected _expired:boolean=true;

  constructor(public time:number,protected callback?:()=>void) {
    this._countDown=time;
  }

  public get expired() : boolean {
    return this._expired;
  }
  
  public start() {
    this._expired=false;
  }

  public reset(){
    this._countDown=this.time;
    this._expired=true;
  }

  public restart() {
    this.reset();
    this.start();
  }

  public update(timeDelta:number) {
    if(!this._expired) {
      this._countDown-=timeDelta;
      if(this._countDown<=0) {
        this._expired=true;
        this.callback && this.callback();
      }
    }
  }
}
