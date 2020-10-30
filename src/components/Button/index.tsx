import React from 'react'
import { css } from '@emotion/core'
import styled from '@emotion/styled'
import { Theme } from '../../utils/theme'
import { color, ColorProps } from '../../utils/color'

type ButtonProps = {
  variant?: 'text' | 'contained'  
} & ColorProps & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>

const StyledButton = styled.button<ButtonProps, Theme>`
  ${props => props.variant === 'text' ? css`
    ${color(props)}
    background: none;
  ` : ''}
	border: none;
	padding: 0;
	font: inherit;
	cursor: pointer;
	outline: inherit;
`

export const Button = ({
  children,
  textColor = 'primary',
  variant = 'text',
  ...otherProps
}: ButtonProps) => {
  return (
    <StyledButton {...{ variant, textColor }} {...otherProps}>
      {children}
    </StyledButton>
  )
}