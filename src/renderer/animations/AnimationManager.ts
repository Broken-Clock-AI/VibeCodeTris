// src/renderer/animations/AnimationManager.ts
import { LineClearAnimation } from './types';
import { CenterOutWipeAnimation } from './CenterOutWipeAnimation';
import { FlickerFadeAnimation } from './FlickerFadeAnimation';

export class AnimationManager {
    private animations: Map<string, LineClearAnimation> = new Map();
    private activeAnimation: LineClearAnimation;

    constructor() {
        this.register(new CenterOutWipeAnimation());
        this.register(new FlickerFadeAnimation());
        this.activeAnimation = this.animations.values().next().value; // Set default
    }

    private register(animation: LineClearAnimation): void {
        this.animations.set(animation.name, animation);
    }

    public setAnimation(name: string): void {
        const newAnimation = this.animations.get(name);
        if (newAnimation) {
            this.activeAnimation = newAnimation;
            console.log(`Line clear animation set to: ${name}`);
        } else {
            console.warn(`Animation "${name}" not found. Keeping current animation.`);
        }
    }
    
    public getActiveAnimation(): LineClearAnimation {
        return this.activeAnimation;
    }

    public getAnimationNames(): string[] {
        return Array.from(this.animations.keys());
    }
}
