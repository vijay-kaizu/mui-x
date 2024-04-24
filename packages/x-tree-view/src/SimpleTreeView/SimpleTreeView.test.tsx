import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, createRenderer, ErrorBoundary, fireEvent, screen } from '@mui-internal/test-utils';
import Portal from '@mui/material/Portal';
import { SimpleTreeView, simpleTreeViewClasses as classes } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { describeConformance } from 'test/utils/describeConformance';

describe('<SimpleTreeView />', () => {
  const { render } = createRenderer();

  describeConformance(<SimpleTreeView />, () => ({
    classes,
    inheritComponent: 'ul',
    render,
    refInstanceof: window.HTMLUListElement,
    muiName: 'MuiSimpleTreeView',
    skip: ['componentProp', 'componentsProp', 'themeVariants'],
  }));

  describe('warnings', () => {
    it('should not crash when shift clicking a clean tree', () => {
      render(
        <SimpleTreeView multiSelect>
          <TreeItem itemId="one" label="one" />
          <TreeItem itemId="two" label="two" />
        </SimpleTreeView>,
      );

      fireEvent.click(screen.getByText('one'), { shiftKey: true });
    });

    it('should not crash when selecting multiple items in a deeply nested tree', () => {
      render(
        <SimpleTreeView multiSelect defaultExpandedItems={['1', '1.1', '2']}>
          <TreeItem itemId="1" label="Item 1">
            <TreeItem itemId="1.1" label="Item 1.1">
              <TreeItem itemId="1.1.1" data-testid="item-1.1.1" label="Item 1.1.1" />
            </TreeItem>
          </TreeItem>
          <TreeItem itemId="2" data-testid="item-2" label="Item 2" />
        </SimpleTreeView>,
      );
      fireEvent.click(screen.getByText('Item 1.1.1'));
      fireEvent.click(screen.getByText('Item 2'), { shiftKey: true });

      expect(screen.getByTestId('item-1.1.1')).to.have.attribute('aria-selected', 'true');
      expect(screen.getByTestId('item-2')).to.have.attribute('aria-selected', 'true');
    });

    it('should not crash when unmounting with duplicate ids', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      function CustomTreeItem(props: any) {
        return <TreeItem itemId="iojerogj" />;
      }
      function App() {
        const [isVisible, hideTreeView] = React.useReducer(() => false, true);

        return (
          <React.Fragment>
            <button onClick={hideTreeView} type="button">
              Toggle
            </button>
            {isVisible && (
              <SimpleTreeView>
                <TreeItem itemId="a" label="b">
                  <CustomTreeItem itemId="a" />
                </TreeItem>
              </SimpleTreeView>
            )}
          </React.Fragment>
        );
      }
      const errorRef = React.createRef<ErrorBoundary>();
      render(
        <ErrorBoundary ref={errorRef}>
          <App />
        </ErrorBoundary>,
      );

      expect(() => {
        act(() => {
          screen.getByRole('button').click();
        });
      }).not.toErrorDev();
    });
  });

  it('should call onKeyDown when a key is pressed', () => {
    const handleTreeViewKeyDown = spy();
    const handleTreeItemKeyDown = spy();

    const { getByTestId } = render(
      <SimpleTreeView onKeyDown={handleTreeViewKeyDown}>
        <TreeItem itemId="one" data-testid="one" onKeyDown={handleTreeItemKeyDown} />
      </SimpleTreeView>,
    );

    const itemOne = getByTestId('one');
    act(() => {
      itemOne.focus();
    });

    fireEvent.keyDown(itemOne, { key: 'Enter' });
    fireEvent.keyDown(itemOne, { key: 'A' });
    fireEvent.keyDown(itemOne, { key: ']' });

    expect(handleTreeViewKeyDown.callCount).to.equal(3);
    expect(handleTreeItemKeyDown.callCount).to.equal(3);
  });

  it('should select item when Enter key is pressed ', () => {
    const handleKeyDown = spy();

    const { getByTestId } = render(
      <SimpleTreeView onKeyDown={handleKeyDown}>
        <TreeItem itemId="one" data-testid="one" />
      </SimpleTreeView>,
    );
    act(() => {
      getByTestId('one').focus();
    });

    expect(getByTestId('one')).not.to.have.attribute('aria-selected');

    fireEvent.keyDown(getByTestId('one'), { key: 'Enter' });

    expect(getByTestId('one')).to.have.attribute('aria-selected');
  });

  it('should not error when component state changes', () => {
    function MyComponent() {
      const [, setState] = React.useState(1);

      return (
        <SimpleTreeView
          defaultExpandedItems={['one']}
          onItemFocus={() => {
            setState(Math.random);
          }}
        >
          <TreeItem itemId="one" data-testid="one">
            <TreeItem itemId="two" data-testid="two" />
          </TreeItem>
        </SimpleTreeView>
      );
    }

    const { getByTestId } = render(<MyComponent />);

    fireEvent.focus(getByTestId('one'));
    fireEvent.focus(getByTestId('one'));
    expect(getByTestId('one')).toHaveFocus();

    fireEvent.keyDown(getByTestId('one'), { key: 'ArrowDown' });

    expect(getByTestId('two')).toHaveFocus();

    fireEvent.keyDown(getByTestId('two'), { key: 'ArrowUp' });

    expect(getByTestId('one')).toHaveFocus();

    fireEvent.keyDown(getByTestId('one'), { key: 'ArrowDown' });

    expect(getByTestId('two')).toHaveFocus();
  });

  it('should support conditional rendered tree items', () => {
    function TestComponent() {
      const [hide, setState] = React.useState(false);

      return (
        <React.Fragment>
          <button type="button" onClick={() => setState(true)}>
            Hide
          </button>
          <SimpleTreeView>{!hide && <TreeItem itemId="test" label="test" />}</SimpleTreeView>
        </React.Fragment>
      );
    }

    const { getByText, queryByText } = render(<TestComponent />);

    expect(getByText('test')).not.to.equal(null);
    fireEvent.click(getByText('Hide'));
    expect(queryByText('test')).to.equal(null);
  });

  it('should work in a portal', () => {
    const { getByTestId } = render(
      <Portal>
        <SimpleTreeView>
          <TreeItem itemId="one" data-testid="one" />
          <TreeItem itemId="two" data-testid="two" />
          <TreeItem itemId="three" data-testid="three" />
          <TreeItem itemId="four" data-testid="four" />
        </SimpleTreeView>
      </Portal>,
    );

    act(() => {
      getByTestId('one').focus();
    });
    fireEvent.keyDown(getByTestId('one'), { key: 'ArrowDown' });

    expect(getByTestId('two')).toHaveFocus();

    fireEvent.keyDown(getByTestId('two'), { key: 'ArrowDown' });

    expect(getByTestId('three')).toHaveFocus();

    fireEvent.keyDown(getByTestId('three'), { key: 'ArrowDown' });

    expect(getByTestId('four')).toHaveFocus();
  });

  it('should update indexes when two items are swapped', () => {
    const onSelectedItemsChange = spy();

    function TestComponent() {
      const [items, setItems] = React.useState(['1', '2', '3']);

      return (
        <React.Fragment>
          <button type="button" onClick={() => setItems(['1', '3', '2'])}>
            Swap items
          </button>
          <SimpleTreeView onSelectedItemsChange={onSelectedItemsChange} multiSelect>
            {items.map((itemId) => (
              <TreeItem key={itemId} itemId={itemId} label={itemId} />
            ))}
          </SimpleTreeView>
        </React.Fragment>
      );
    }

    const { getByText } = render(<TestComponent />);
    fireEvent.click(getByText('Swap items'));
    fireEvent.click(getByText('1'));
    fireEvent.click(getByText('3'), { shiftKey: true });
    expect(onSelectedItemsChange.lastCall.args[1]).to.deep.equal(['1', '3']);
  });

  describe('Accessibility', () => {
    it('(TreeView) should have the role `tree`', () => {
      const { getByRole } = render(<SimpleTreeView />);

      expect(getByRole('tree')).not.to.equal(null);
    });
  });
});
