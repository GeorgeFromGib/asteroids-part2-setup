import { Vector } from 'p5';
import { Actor, IModel } from '../../shared/actors/base/actor';
import { Manager } from '../../shared/managers/manager';
import { AsteroidsGame } from '../../asteroidsGame';
import { TextActor } from './textActor';

export enum Justify {
    LEFT,
    RIGHT,
    CENTER
}
export interface ICharacterModel {
    char:string;
    vertices:number[][];
}

export interface ITextModel {
    vertexes:number[][];
    radius:number;
    characters: ICharacterModel[];
}

export interface IText {
    name:string;
    characters:Actor[];
    position:Vector;

}

export class TextManager extends Manager {
    texts:IText[]=[];
    protected textModel:ITextModel

    constructor(gameEngine:AsteroidsGame) {
        super(gameEngine);
        this.textModel=gameEngine.configData.text;
    }

    public write(name:string, message:string,xPos:number,yPos:number, scale:number, justify:Justify) {
        const messChars=[...message.toUpperCase()];
        const space=4;
        let adjXpos=0;
        if(justify===Justify.RIGHT)
            adjXpos=xPos-((this.textModel.radius + space)*scale*messChars.length);
        else if (justify===Justify.CENTER)
            adjXpos=xPos-((this.textModel.radius + space)*scale*messChars.length/2);
        const pos=new Vector().set(adjXpos,yPos);
        let l_xpos=0;
        const actors:Actor[]=[];
        messChars.forEach(c => {
            const model:IModel={
                vertexes:this.textModel.vertexes.map(v=>[v[0]+l_xpos,v[1]]),
                vertices:this.textModel.characters.find(h=>h.char===c).vertices,
                radius:this.textModel.radius
            }
            const charActor=new TextActor(model);
            charActor.position=pos;
            charActor.scale=scale;
            actors.push(charActor);
            l_xpos+=this.textModel.radius + space;
        });
        this.clear(name);
        const text:IText={name:name,characters:actors,position:pos}
        this.texts.push(text);
    }

    public clear(name:string) {
        this.texts=this.texts.filter(t=>t.name!==name);
    }

    public update(timeDelta:number) {
        this._actors=[];
        this.texts.forEach(t=>{
            this._actors.push(...t.characters);
        })
        super.update(timeDelta);

    }

    

}