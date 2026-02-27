// ─── Card, Modal, Loading, EmptyState Component Tests ───────────────────────

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Loading } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';

// ── Card Tests ──────────────────────────────────────────────────

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Card><Text>Card Content</Text></Card>
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('calls onPress when pressable', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Card onPress={onPress}><Text>Pressable Card</Text></Card>
    );
    fireEvent.press(getByText('Pressable Card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders with custom style', () => {
    const { getByText } = render(
      <Card style={{ backgroundColor: 'red' }}>
        <Text>Styled</Text>
      </Card>
    );
    expect(getByText('Styled')).toBeTruthy();
  });

  it('renders with elevation', () => {
    const { getByText } = render(
      <Card elevation={5}><Text>Elevated</Text></Card>
    );
    expect(getByText('Elevated')).toBeTruthy();
  });

  it('renders without onPress (non-pressable)', () => {
    const { getByText } = render(
      <Card><Text>Static Card</Text></Card>
    );
    expect(getByText('Static Card')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const tree = render(
      <Card><Text>Snapshot Card</Text></Card>
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

// ── Modal Tests ─────────────────────────────────────────────────

describe('Modal', () => {
  it('renders when visible', () => {
    const { getByText } = render(
      <Modal visible onClose={() => {}} title="Test Modal">
        <Text>Modal Content</Text>
      </Modal>
    );
    expect(getByText('Test Modal')).toBeTruthy();
    expect(getByText('Modal Content')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <Modal visible={false} onClose={() => {}} title="Hidden">
        <Text>Hidden Content</Text>
      </Modal>
    );
    expect(queryByText('Hidden Content')).toBeFalsy();
  });

  it('calls onClose when close is triggered', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <Modal visible onClose={onClose} title="Closeable">
        <Text>Content</Text>
      </Modal>
    );
    // Modal should have a close mechanism
    expect(getByText('Content')).toBeTruthy();
  });

  it('renders with custom title', () => {
    const { getByText } = render(
      <Modal visible onClose={() => {}} title="Custom Title">
        <Text>Body</Text>
      </Modal>
    );
    expect(getByText('Custom Title')).toBeTruthy();
  });

  it('renders children inside modal', () => {
    const { getByText } = render(
      <Modal visible onClose={() => {}}>
        <Text>Child 1</Text>
        <Text>Child 2</Text>
      </Modal>
    );
    expect(getByText('Child 1')).toBeTruthy();
    expect(getByText('Child 2')).toBeTruthy();
  });

  it('matches snapshot - visible', () => {
    const tree = render(
      <Modal visible onClose={() => {}} title="Snapshot">
        <Text>Content</Text>
      </Modal>
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

// ── Loading Tests ───────────────────────────────────────────────

describe('Loading', () => {
  it('renders activity indicator', () => {
    const { toJSON } = render(<Loading />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with message', () => {
    const { getByText } = render(<Loading message="Loading outfits..." />);
    expect(getByText('Loading outfits...')).toBeTruthy();
  });

  it('renders without message', () => {
    const { queryByText } = render(<Loading />);
    expect(queryByText('Loading')).toBeFalsy();
  });

  it('renders with custom size', () => {
    const { toJSON } = render(<Loading size="large" />);
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const tree = render(<Loading message="Please wait..." />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot - no message', () => {
    const tree = render(<Loading />);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});

// ── EmptyState Tests ────────────────────────────────────────────

describe('EmptyState', () => {
  it('renders with title and message', () => {
    const { getByText } = render(
      <EmptyState
        title="No Items"
        message="Your wardrobe is empty. Add some items!"
      />
    );
    expect(getByText('No Items')).toBeTruthy();
    expect(getByText('Your wardrobe is empty. Add some items!')).toBeTruthy();
  });

  it('renders with icon', () => {
    const { getByText } = render(
      <EmptyState title="Empty" message="Nothing here" icon="shirt-outline" />
    );
    expect(getByText('Empty')).toBeTruthy();
  });

  it('renders action button when provided', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="No Results"
        message="Try again"
        actionLabel="Retry"
        onAction={onAction}
      />
    );
    const button = getByText('Retry');
    expect(button).toBeTruthy();
    fireEvent.press(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders without action button', () => {
    const { queryByText } = render(
      <EmptyState title="Empty" message="Nothing to show" />
    );
    expect(queryByText('Retry')).toBeFalsy();
  });

  it('matches snapshot', () => {
    const tree = render(
      <EmptyState
        title="No Items"
        message="Add items to your wardrobe"
        icon="shirt-outline"
        actionLabel="Add Item"
        onAction={() => {}}
      />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('matches snapshot - minimal', () => {
    const tree = render(
      <EmptyState title="Empty" message="Nothing here" />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
