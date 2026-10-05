export interface IMA_Row {
  time_s: number;
  [key: string]: number;
}

export interface ENCR1_Row {
  timestamp_utc: string;
  network: string;
  station: string;
  location: string;
  channel: string;
  sampling_rate_hz: number;
  sample_index: number;
  value: number;
}

export function parseIMA_CSV(text: string): { headers: string[]; data: IMA_Row[] } {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data: IMA_Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const values = lines[i].split(',');
    const row: any = { time_s: parseFloat(values[0]) };
    for (let j = 1; j < headers.length; j++) {
      row[headers[j]] = parseFloat(values[j]);
    }
    data.push(row as IMA_Row);
  }
  return { headers, data };
}

export function parseENCR1_CSV(text: string): { data: ENCR1_Row[] } {
  const lines = text.trim().split('\n');
  const data: ENCR1_Row[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const values = lines[i].split(',');
    if (values.length < 8) continue;
    data.push({
      timestamp_utc: values[0],
      network: values[1],
      station: values[2],
      location: values[3],
      channel: values[4],
      sampling_rate_hz: parseFloat(values[5]),
      sample_index: parseInt(values[6], 10),
      value: parseFloat(values[7]),
    });
  }
  return { data };
}
