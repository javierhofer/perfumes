export class CustomerNotifier {
  private fallbackText: string = process.env.WA_BACKUP_CONTACT ?? '';

  setFallback(text: string): void {
    this.fallbackText = text;
  }

  formatPoolDownResponse(): string {
    if (!this.fallbackText) {
      return 'En este momento no puedo responder por una falla tecnica. Intenta mas tarde, por favor.';
    }
    return [
      'Hola! Por una falla tecnica en mi WhatsApp, no voy a poder responder como siempre.',
      '',
      `Mientras tanto, contactame por: ${this.fallbackText}`,
      '',
      'Disculpa las molestias, en breve vuelvo a estar online.',
    ].join('\n');
  }

  formatPoolDegradedResponse(original: string): string {
    return `${original}\n\n(Estamos con intermitencias, gracias por tu paciencia.)`;
  }

  formatRecoveryGreeting(): string {
    return 'Ya estamos online de nuevo, gracias por esperar!';
  }

  hasFallback(): boolean {
    return this.fallbackText.trim().length > 0;
  }
}

export const globalNotifier = new CustomerNotifier();