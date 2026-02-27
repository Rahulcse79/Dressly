// ─── Input Component Tests ──────────────────────────────────────────────────

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../../components/ui/Input';

describe('Input', () => {
  // ── Rendering ─────────────────────────────────────────────────

  it('renders with placeholder', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter email" onChangeText={() => {}} />
    );
    expect(getByPlaceholderText('Enter email')).toBeTruthy();
  });

  it('renders with label', () => {
    const { getByText } = render(
      <Input label="Email" placeholder="Enter email" onChangeText={() => {}} />
    );
    expect(getByText('Email')).toBeTruthy();
  });

  it('renders with error message', () => {
    const { getByText } = render(
      <Input
        label="Email"
        error="Invalid email format"
        onChangeText={() => {}}
      />
    );
    expect(getByText('Invalid email format')).toBeTruthy();
  });

  it('renders with hint text', () => {
    const { getByText } = render(
      <Input label="Password" hint="Min 8 characters" onChangeText={() => {}} />
    );
    expect(getByText('Min 8 characters')).toBeTruthy();
  });

  it('renders with value', () => {
    const { getByDisplayValue } = render(
      <Input value="test@dressly.com" onChangeText={() => {}} />
    );
    expect(getByDisplayValue('test@dressly.com')).toBeTruthy();
  });

  // ── Interaction ───────────────────────────────────────────────

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Type here" onChangeText={onChangeText} />
    );
    fireEvent.changeText(getByPlaceholderText('Type here'), 'new text');
    expect(onChangeText).toHaveBeenCalledWith('new text');
  });

  it('calls onChangeText for each keystroke', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Type" onChangeText={onChangeText} />
    );
    fireEvent.changeText(getByPlaceholderText('Type'), 'a');
    fireEvent.changeText(getByPlaceholderText('Type'), 'ab');
    fireEvent.changeText(getByPlaceholderText('Type'), 'abc');
    expect(onChangeText).toHaveBeenCalledTimes(3);
  });

  // ── Focus/Blur ────────────────────────────────────────────────

  it('handles focus event', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Focus me" onChangeText={() => {}} />
    );
    fireEvent(getByPlaceholderText('Focus me'), 'focus');
    // Should not throw
  });

  it('handles blur event', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Blur me" onChangeText={() => {}} />
    );
    fireEvent(getByPlaceholderText('Blur me'), 'blur');
    // Should not throw
  });

  // ── SecureTextEntry (Password) ────────────────────────────────

  it('renders as password field with secureTextEntry', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Password" secureTextEntry onChangeText={() => {}} />
    );
    const input = getByPlaceholderText('Password');
    expect(input.props.secureTextEntry).toBeTruthy();
  });

  // ── Disabled State ────────────────────────────────────────────

  it('renders disabled input', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Disabled" editable={false} onChangeText={() => {}} />
    );
    expect(getByPlaceholderText('Disabled').props.editable).toBe(false);
  });

  // ── Multiline ─────────────────────────────────────────────────

  it('supports multiline input', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Multi" multiline onChangeText={() => {}} />
    );
    expect(getByPlaceholderText('Multi').props.multiline).toBe(true);
  });

  // ── Keyboard Types ────────────────────────────────────────────

  it('sets email keyboard type', () => {
    const { getByPlaceholderText } = render(
      <Input
        placeholder="Email"
        keyboardType="email-address"
        onChangeText={() => {}}
      />
    );
    expect(getByPlaceholderText('Email').props.keyboardType).toBe('email-address');
  });

  it('sets numeric keyboard type', () => {
    const { getByPlaceholderText } = render(
      <Input
        placeholder="Number"
        keyboardType="numeric"
        onChangeText={() => {}}
      />
    );
    expect(getByPlaceholderText('Number').props.keyboardType).toBe('numeric');
  });

  // ── Snapshots ─────────────────────────────────────────────────

  it('matches snapshot - default', () => {
    const tree = render(<Input placeholder="Default" onChangeText={() => {}} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot - with label and error', () => {
    const tree = render(
      <Input label="Email" error="Required" onChangeText={() => {}} />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot - password', () => {
    const tree = render(
      <Input label="Password" secureTextEntry onChangeText={() => {}} />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
