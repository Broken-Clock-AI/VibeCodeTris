// src/ui/accessibility.ts

/**
 * Manages accessibility features, primarily the screen reader HUD.
 * This class will create and update ARIA live regions to announce
 * important game state changes to users relying on screen readers.
 */
export class AccessibilityManager {
    private hudElement: HTMLElement;

    constructor(container: HTMLElement) {
        this.hudElement = document.createElement('div');
        this.hudElement.id = 'accessibility-hud';
        
        // ARIA properties to make screen readers announce changes
        this.hudElement.setAttribute('role', 'status');
        this.hudElement.setAttribute('aria-live', 'assertive');
        this.hudElement.setAttribute('aria-atomic', 'true');

        // Visually hide the element while keeping it accessible
        this.hudElement.style.position = 'absolute';
        this.hudElement.style.width = '1px';
        this.hudElement.style.height = '1px';
        this.hudElement.style.padding = '0';
        this.hudElement.style.margin = '-1px';
        this.hudElement.style.overflow = 'hidden';
        this.hudElement.style.clip = 'rect(0, 0, 0, 0)';
        this.hudElement.style.whiteSpace = 'nowrap';
        this.hudElement.style.border = '0';

        container.appendChild(this.hudElement);
        console.log("AccessibilityManager initialized.");
    }

    /**
     * Announce a message to the screen reader.
     * @param message The text to be announced.
     */
    public announce(message: string): void {
        // Set the text content, which screen readers will pick up and announce.
        this.hudElement.textContent = message;
        console.log(`Accessibility Announce: ${message}`);
    }

    /**
     * Cleans up the HUD element.
     */
    public destroy(): void {
        if (this.hudElement.parentElement) {
            this.hudElement.parentElement.removeChild(this.hudElement);
        }
    }
}
