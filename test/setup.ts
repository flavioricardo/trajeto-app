import { beforeEach } from 'vitest'

/**
 * Idioma fixo em português nos testes.
 *
 * Sem isso a suíte passaria a depender do `navigator.language` da máquina que
 * roda: em CI vem `en-US` e todo `getByText` em português quebraria. O inglês
 * tem teste próprio, que troca o idioma pela interface.
 */
const pin = () => localStorage.setItem('storyline_lang', 'pt')

pin()
beforeEach(pin)
