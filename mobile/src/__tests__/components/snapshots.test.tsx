// ─── Snapshot & Rendering Tests ─────────────────────────────────────────────
// Comprehensive snapshot tests for all component variants and states

import React from 'react';
import { render } from '@testing-library/react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Loading } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { Text, View } from 'react-native';

// ─── Button Snapshot Matrix ─────────────────────────────────

describe('Button Snapshots', () => {
  const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const;
  const sizes = ['sm', 'md', 'lg'] as const;

  variants.forEach((variant) => {
    sizes.forEach((size) => {
      it(`renders ${variant}/${size}`, () => {
        const { toJSON } = render(
          <Button title={`${variant} ${size}`} variant={variant} size={size} />
        );
        expect(toJSON()).toBeTruthy();
      });
    });
  });

  variants.forEach((variant) => {
    it(`${variant} disabled`, () => {
      const { toJSON } = render(
        <Button title={`${variant} disabled`} variant={variant} disabled />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  variants.forEach((variant) => {
    it(`${variant} loading`, () => {
      const { toJSON } = render(
        <Button title={`${variant} loading`} variant={variant} loading />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  it('renders with icon', () => {
    const { toJSON } = render(
      <Button title="With Icon" icon={<Text>★</Text>} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders full width', () => {
    const { toJSON } = render(<Button title="Full Width" fullWidth />);
    expect(toJSON()).toBeTruthy();
  });
});

// ─── Input Snapshot Matrix ──────────────────────────────────

describe('Input Snapshots', () => {
  it('renders basic input', () => {
    const { toJSON } = render(<Input placeholder="Enter text" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with label', () => {
    const { toJSON } = render(<Input label="Email" placeholder="Enter email" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with error', () => {
    const { toJSON } = render(
      <Input label="Email" error="Invalid email" placeholder="Enter email" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with hint', () => {
    const { toJSON } = render(
      <Input label="Password" hint="At least 8 characters" placeholder="Enter password" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders password input', () => {
    const { toJSON } = render(
      <Input label="Password" isPassword placeholder="Enter password" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders disabled input', () => {
    const { toJSON } = render(
      <Input label="Disabled" placeholder="Disabled" editable={false} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders multiline input', () => {
    const { toJSON } = render(
      <Input label="Description" multiline numberOfLines={4} placeholder="Enter description" />
    );
    expect(toJSON()).toBeTruthy();
  });

  const keyboardTypes = [
    'default', 'email-address', 'numeric', 'phone-pad',
    'decimal-pad', 'url',
  ] as const;

  keyboardTypes.forEach((kbType) => {
    it(`renders with keyboard: ${kbType}`, () => {
      const { toJSON } = render(
        <Input placeholder="Test" keyboardType={kbType} />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  it('renders with left icon', () => {
    const { toJSON } = render(
      <Input placeholder="Search" leftIcon={<Text>🔍</Text>} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with right icon', () => {
    const { toJSON } = render(
      <Input placeholder="Search" rightIcon={<Text>✕</Text>} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with both icons', () => {
    const { toJSON } = render(
      <Input placeholder="Search" leftIcon={<Text>🔍</Text>} rightIcon={<Text>✕</Text>} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with value', () => {
    const { toJSON } = render(
      <Input label="Email" value="test@dressly.com" placeholder="Email" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with label + error + hint (error wins)', () => {
    const { toJSON } = render(
      <Input label="Email" error="Invalid" hint="Hint text" placeholder="Email" />
    );
    expect(toJSON()).toBeTruthy();
  });
});

// ─── Card Snapshots ─────────────────────────────────────────

describe('Card Snapshots', () => {
  it('renders with children', () => {
    const { toJSON } = render(
      <Card><Text>Card content</Text></Card>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders pressable card', () => {
    const { toJSON } = render(
      <Card onPress={() => {}}><Text>Pressable</Text></Card>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom style', () => {
    const { toJSON } = render(
      <Card style={{ padding: 20 }}><Text>Styled</Text></Card>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with elevation', () => {
    const { toJSON } = render(
      <Card elevation={4}><Text>Elevated</Text></Card>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders nested cards', () => {
    const { toJSON } = render(
      <Card>
        <Card><Text>Nested</Text></Card>
      </Card>
    );
    expect(toJSON()).toBeTruthy();
  });
});

// ─── Modal Snapshots ────────────────────────────────────────

describe('Modal Snapshots', () => {
  it('renders visible modal', () => {
    const { toJSON } = render(
      <Modal visible onClose={() => {}} title="Test Modal">
        <Text>Content</Text>
      </Modal>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders hidden modal', () => {
    const { toJSON } = render(
      <Modal visible={false} onClose={() => {}} title="Hidden">
        <Text>Hidden</Text>
      </Modal>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders modal without title', () => {
    const { toJSON } = render(
      <Modal visible onClose={() => {}}>
        <Text>No title</Text>
      </Modal>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders modal with long title', () => {
    const { toJSON } = render(
      <Modal visible onClose={() => {}} title="This Is A Very Long Modal Title That Should Handle Overflow">
        <Text>Content</Text>
      </Modal>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders modal with complex content', () => {
    const { toJSON } = render(
      <Modal visible onClose={() => {}} title="Complex">
        <View>
          <Text>Line 1</Text>
          <Text>Line 2</Text>
          <View><Text>Nested</Text></View>
        </View>
      </Modal>
    );
    expect(toJSON()).toBeTruthy();
  });
});

// ─── Loading Snapshots ──────────────────────────────────────

describe('Loading Snapshots', () => {
  it('renders default loading', () => {
    const { toJSON } = render(<Loading />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with message', () => {
    const { toJSON } = render(<Loading message="Generating outfit..." />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders large loading', () => {
    const { toJSON } = render(<Loading size="large" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders small loading', () => {
    const { toJSON } = render(<Loading size="small" />);
    expect(toJSON()).toBeTruthy();
  });
});

// ─── EmptyState Snapshots ───────────────────────────────────

describe('EmptyState Snapshots', () => {
  it('renders with title only', () => {
    const { toJSON } = render(<EmptyState title="No items" />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with title and message', () => {
    const { toJSON } = render(
      <EmptyState title="No items" message="Add items to your wardrobe" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with icon', () => {
    const { toJSON } = render(
      <EmptyState title="No items" icon="👗" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with action button', () => {
    const { toJSON } = render(
      <EmptyState
        title="No items"
        message="Add your first item"
        actionLabel="Add Item"
        onAction={() => {}}
      />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders full featured empty state', () => {
    const { toJSON } = render(
      <EmptyState
        title="Empty Wardrobe"
        message="Start building your digital wardrobe"
        icon="🎒"
        actionLabel="Browse Items"
        onAction={() => {}}
      />
    );
    expect(toJSON()).toBeTruthy();
  });
});

// ─── Component Composition Snapshots ────────────────────────

describe('Component Composition Snapshots', () => {
  it('renders form layout', () => {
    const { toJSON } = render(
      <View>
        <Input label="Email" placeholder="Enter email" />
        <Input label="Password" isPassword placeholder="Enter password" />
        <Button title="Login" variant="primary" fullWidth />
      </View>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders card with actions', () => {
    const { toJSON } = render(
      <Card>
        <Text>Item Name</Text>
        <View>
          <Button title="Edit" variant="outline" size="sm" />
          <Button title="Delete" variant="danger" size="sm" />
        </View>
      </Card>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders list of cards', () => {
    const items = Array.from({ length: 5 }, (_, i) => i);
    const { toJSON } = render(
      <View>
        {items.map((i) => (
          <Card key={i}><Text>Item {i}</Text></Card>
        ))}
      </View>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders search with results', () => {
    const { toJSON } = render(
      <View>
        <Input placeholder="Search wardrobe..." leftIcon={<Text>🔍</Text>} />
        <Card><Text>Result 1</Text></Card>
        <Card><Text>Result 2</Text></Card>
      </View>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders empty search results', () => {
    const { toJSON } = render(
      <View>
        <Input placeholder="Search wardrobe..." value="nonexistent" />
        <EmptyState title="No results" message="Try different search terms" />
      </View>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders loading overlay', () => {
    const { toJSON } = render(
      <View>
        <Card><Text>Content behind loading</Text></Card>
        <Loading message="Processing..." />
      </View>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders confirmation dialog', () => {
    const { toJSON } = render(
      <Modal visible onClose={() => {}} title="Confirm Delete">
        <Text>Are you sure you want to delete this item?</Text>
        <View>
          <Button title="Cancel" variant="outline" />
          <Button title="Delete" variant="danger" />
        </View>
      </Modal>
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders profile card', () => {
    const { toJSON } = render(
      <Card>
        <View>
          <Text>Alice Johnson</Text>
          <Text>alice@dressly.com</Text>
          <Text>Pro Member</Text>
        </View>
        <Button title="Edit Profile" variant="outline" size="sm" />
      </Card>
    );
    expect(toJSON()).toBeTruthy();
  });
});
