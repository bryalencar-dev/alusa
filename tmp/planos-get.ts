import { GET } from '../apps/web/app/api/planos/route';

async function main() {
  const res = await GET(
    new Request('http://localhost/api/planos?contaId=038ae23c-7964-4a01-a985-0026bd346fea'),
  );
  console.log('status', res.status);
  console.log('json', await res.json());
}

void main();
