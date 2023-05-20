export class Upload {
  private formData: FormData;

  constructor(file: File) {
    let data = new FormData();
    data.append('file', file);

    this.formData = data;
  }

  private async uploadFile(procedureName: string, input: Record<string, unknown>) {
    this.formData.append('input', JSON.stringify(input));
    this.formData.append('procedure', procedureName);

    await fetch('/uploads/new', {
      method: 'POST',
      body: this.formData
    });
  }
  
  public async tournamentBanner(input: {
    tournamentId: number;
  }) {
    await this.uploadFile('tournamentBanner', input);
  }
}