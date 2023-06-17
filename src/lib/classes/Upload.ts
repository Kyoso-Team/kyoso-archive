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

    let resp = await fetch('/uploads/new', {
      method: 'POST',
      body: this.formData
    });
    
    return await resp.text();
  }

  public async tournamentBanner(input: { tournamentId: number }) {
    return await this.uploadFile('tournamentBanner', input);
  }

  public async tournamentLogo(input: { tournamentId: number }) {
    return await this.uploadFile('tournamentLogo', input);
  }
}
