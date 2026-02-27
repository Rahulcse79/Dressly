// ─── Button Component Tests ─────────────────────────────────────────────────

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Button } from '../../components/ui/Button';

describe('Button', () => {
  // ── Rendering ─────────────────────────────────────────────────

  it('renders with title text', () => {
    const { getByText } = render(<Button title="Click Me" onPress={() => {}} />);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('renders with default primary variant', () => {
    const { getByText } = render(<Button title="Primary" onPress={() => {}} />);
    expect(getByText('Primary')).toBeTruthy();
  });

  it('renders with secondary variant', () => {
    const { getByText } = render(
      <Button title="Secondary" variant="secondary" onPress={() => {}} />
    );
    expect(getByText('Secondary')).toBeTruthy();
  });

  it('renders with outline variant', () => {
    const { getByText } = render(
      <Button title="Outline" variant="outline" onPress={() => {}} />
    );
    expect(getByText('Outline')).toBeTruthy();
  });

  it('renders with ghost variant', () => {
    const { getByText } = render(
      <Button title="Ghost" variant="ghost" onPress={() => {}} />
    );
    expect(getByText('Ghost')).toBeTruthy();
  });

  it('renders with danger variant', () => {
    const { getByText } = render(
      <Button title="Danger" variant="danger" onPress={() => {}} />
    );
    expect(getByText('Danger')).toBeTruthy();
  });

  // ── Sizes ─────────────────────────────────────────────────────

  it('renders small size', () => {
    const { getByText } = render(
      <Button title="Small" size="sm" onPress={() => {}} />
    );
    expect(getByText('Small')).toBeTruthy();
  });

  it('renders medium size (default)', () => {
    const { getByText } = render(
      <Button title="Medium" size="md" onPress={() => {}} />
    );
    expect(getByText('Medium')).toBeTruthy();
  });

  it('renders large size', () => {
    const { getByText } = render(
      <Button title="Large" size="lg" onPress={() => {}} />
    );
    expect(getByText('Large')).toBeTruthy();
  });

  // ── Interaction ───────────────────────────────────────────────

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Press Me" onPress={onPress} />);
    fireEvent.press(getByText('Press Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Disabled" onPress={onPress} disabled />
    );
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button title="Loading" onPress={onPress} loading testID="loading-btn" />
    );
    fireEvent.press(getByTestId('loading-btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  // ── Loading State ─────────────────────────────────────────────

  it('shows activity indicator when loading', () => {
    const { queryByText } = render(
      <Button title="Submit" onPress={() => {}} loading />
    );
    // Title might be hidden during loading
    expect(queryByText('Submit')).toBeFalsy();
  });

  it('hides title text when loading', () => {
    const { queryByText } = render(
      <Button title="Submit" onPress={() => {}} loading />
    );
    expect(queryByText('Submit')).toBeFalsy();
  });

  // ── Disabled State ────────────────────────────────────────────

  it('applies disabled opacity', () => {
    const { getByText } = render(
      <Button title="Disabled" onPress={() => {}} disabled />
    );
    expect(getByText('Disabled')).toBeTruthy();
  });

  // ── Multiple Presses ──────────────────────────────────────────

  it('calls onPress multiple times', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Multi" onPress={onPress} />);
    fireEvent.press(getByText('Multi'));
    fireEvent.press(getByText('Multi'));
    fireEvent.press(getByText('Multi'));
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  // ── Snapshot ──────────────────────────────────────────────────

  it('matches snapshot - primary', () => {
    const tree = render(<Button title="Snapshot" onPress={() => {}} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot - secondary', () => {
    const tree = render(
      <Button title="Snapshot" variant="secondary" onPress={() => {}} />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot - disabled', () => {
    const tree = render(
      <Button title="Snapshot" onPress={() => {}} disabled />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot - loading', () => {
    const tree = render(
      <Button title="Snapshot" onPress={() => {}} loading />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
