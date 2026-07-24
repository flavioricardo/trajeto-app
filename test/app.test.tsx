import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'jotai'
import App from '../src/components/App'

const renderApp = () => render(<Provider><App /></Provider>)

it('adiciona e remove StatBlock', () => {
  renderApp()
  const before = screen.getAllByRole('button', { name: /Remover/ }).length
  fireEvent.click(screen.getByRole('button', { name: /Adicionar dado/ }))
  expect(screen.getAllByRole('button', { name: /Remover/ })).toHaveLength(before + 1)
  fireEvent.click(screen.getAllByRole('button', { name: /Adicionar dado/ })[0])
  fireEvent.click(screen.getAllByRole('button', { name: /Remover/ })[0])
  expect(screen.getAllByRole('button', { name: /Remover/ })).toHaveLength(before + 1)
})

it('trocar preset preserva posicao dos elementos', () => {
  renderApp()
  const stat = screen.getByText('Distância').closest('.stat') as HTMLElement
  const left = stat.style.left
  fireEvent.click(screen.getByRole('button', { name: 'Feed 1:1' }))
  expect((screen.getByText('Distância').closest('.stat') as HTMLElement).style.left).toBe(left)
})
