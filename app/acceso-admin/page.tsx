type Props = {
  searchParams: Promise<{ error?: string; password?: string }>
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams

  return (
    <main className="page">
      <span className="eyebrow">ACCESO PRIVADO</span>
      <h1>PANEL IMPACTO</h1>
      <form className="card" style={{ maxWidth: 460 }} action="/api/auth/login" method="post">
        {params.password === 'created' && (
          <p role="status">Contraseña creada. Ingresa al panel con tus datos.</p>
        )}
        {params.error && (
          <p role="alert" style={{ color: '#ff4d4f' }}>
            No pudimos iniciar sesión. Revisa el correo y la contraseña.
          </p>
        )}
        <label>Correo</label>
        <input name="email" type="email" defaultValue="aircristobalbuzon@gmail.com" autoComplete="email" required />
        <label>Contraseña</label>
        <input name="password" type="password" autoComplete="current-password" required />
        <button>INICIAR SESIÓN</button>
      </form>
    </main>
  )
}
