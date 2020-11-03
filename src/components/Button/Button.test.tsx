import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Button } from '.';

it('renders correctly', async () => {
  const { queryByTestId } = render(<Button>content</Button>);
  expect(queryByTestId('styled-button')).toMatchSnapshot();
});

it('renders snapshot', async () => {
  const { container } = render(<Button textColor="red">click me</Button>);
  expect(container).toMatchSnapshot();
});

it('triggers clicks correctly', async () => {
  const onClick = jest.fn()
  const { getByTestId } = render(<Button onClick={onClick}>click me</Button>);
  fireEvent.click(getByTestId('styled-button'))
  expect(onClick).toBeCalledTimes(1);
});
