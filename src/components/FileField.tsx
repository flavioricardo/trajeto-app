import { useRef, useState } from 'react'

/**
 * Campo de arquivo com o botão do app, não o do navegador.
 *
 * O controle nativo desenha um botão do sistema, que além de destoar de tudo
 * vem no idioma do sistema operacional — em português ele aparecia como "Choose
 * File". Aqui o input fica fora de vista e quem abre o seletor é um botão de
 * verdade, com um só ponto de foco.
 *
 * O botão é o rótulo: repetir o nome do campo acima dele e um "nenhum arquivo
 * escolhido" abaixo seria dizer a mesma coisa três vezes. O nome do arquivo só
 * aparece depois de escolhido, que é quando ele informa alguma coisa.
 */
export default function FileField({ id, accept, label, onFile }: {
  id: string
  accept: string
  /** Ação, na voz do usuário: "Escolha uma foto". Vale de rótulo do controle. */
  label: string
  onFile: (file: File | undefined) => void
}) {
  const [nome, setNome] = useState('')
  const input = useRef<HTMLInputElement>(null)

  return (
    <div className="field file">
      <input
        ref={input}
        id={id}
        className="file-input"
        type="file"
        accept={accept}
        aria-label={label}
        tabIndex={-1}
        onChange={e => {
          const file = e.target.files?.[0]
          setNome(file?.name ?? '')
          onFile(file)
        }}
      />
      <button type="button" className="file-btn" onClick={() => input.current?.click()}>
        {label}
      </button>
      {nome && <p className="file-name">{nome}</p>}
    </div>
  )
}
