import { GameTimer } from "../../asteroidsGame";
import { Particle } from "../../shared/actors/particle";
import { Vector } from "p5";
import { IModel } from "../../shared/actors/base/actor";
import { AsteroidsGame } from "../../asteroidsGame";
import { Manager } from "../../shared/managers/manager";
import { SpaceshipActor } from "./spaceshipActor";

export enum ShipTurn {
    LEFT = -1,
    RIGHT = 1,
    STOP = 0,
}

export interface ISpaceShip {
    ship: IModel;
    thrust: IModel;
    rotationVel: number;
    thrustVel: number;
    friction: number;
    projectileVel: number;
    rateOfFire: number;
    projectileLife: number;
}

export class PlayerShipManager extends Manager {
    ship: SpaceshipActor;
    firing: boolean;
    lastShot = 0;
    projectiles: Particle[] = [];
    spaceship: ISpaceShip;
    shipShowTimer: GameTimer;
    hyperSpaceTimer: GameTimer;

    constructor(gameEngine: AsteroidsGame) {
        super(gameEngine);
        this.shipShowTimer = gameEngine.createTimer(3000, () => {
            this.placeShipInSafeSpace(gameEngine.screenSize.center);
        });
        this.hyperSpaceTimer = gameEngine.createTimer(1000, () => {
            this.placeShipInSafeSpace(
                gameEngine.getRandomScreenPosition(0.2),
                20
            );
        });
        this.spaceship = gameEngine.configData.spaceship;
        this.createShip();
    }

    public createShip() {
        this.ship = new SpaceshipActor(this.spaceship);
        this.ship.position = this.gameEngine.screenSize.center;
        this.ship.show = false;
        this.firing = false;
    }

    public showShip(show: boolean) {
        this.ship.show = show;
        if (!show) {
            this.ship.thrusting = false;
        }
    }

    public startNewLife() {
        this.shipShowTimer.restart();
    }

    public placeShipInSafeSpace(position: Vector, safeRadius: number = 200) {
        let show = true;

        this.gameEngine.asteroidsManager.asteroids.forEach((asteroid) => {
            show = position.dist(asteroid.position) > safeRadius;
            if (!show) return;
        });

        if (show) {
            this.createShip();
            this.ship.position = position.copy();
            this.showShip(true);
        } else {
            this.shipShowTimer.restart();
        }
    }

    public update(timeDelta: number) {
        if (this.firing && this.ship.show)
            if (
                this.gameEngine.elapsedTime - this.lastShot >
                this.spaceship.rateOfFire
            ) {
                this.addProjectile();
                this.lastShot = this.gameEngine.elapsedTime;
            }
        this.projectiles = this.projectiles.filter(
            (p) => !p.expired && !p.collidedWith
        );
        this._actors = [];
        if (this.ship.show) {
            this._actors.push(this.ship);
        }
        this._actors.push(...this.projectiles);
        super.update(timeDelta);
    }

    public shipHit() {
        this.gameEngine.scoresManager.lives--;
        this.showShip(false);
        this.gameEngine.explosionsManager.createShipExplosion(
            this.spaceship.ship,
            this.ship
        );
        if (this.gameEngine.scoresManager.lives > 0) this.startNewLife();
    }

    public turn(turn: ShipTurn) {
        this.ship.turn(turn);
    }

    public engine(on: boolean) {
        this.ship.thrusting = on;
    }

    public fire(on: boolean) {
        this.firing = on;
    }

    public hyperSpace() {
        if (!this.hyperSpaceTimer.expired) return;
        this.showShip(false);
        this.hyperSpaceTimer.restart();
    }

    private addProjectile() {
        const radius = this.spaceship.ship.radius;
        const heading = this.ship.heading - Math.PI / 2;
        const gunPos = new Vector().set(radius, 0).rotate(heading);
        const startPos = gunPos.add(this.ship.position);
        const vel = Vector.fromAngle(heading)
            .mult(this.spaceship.projectileVel)
            .add(this.ship.velocity);
        const proj = new Particle(startPos, vel,this.spaceship.projectileLife);
        this.projectiles.push(proj);
    }
}