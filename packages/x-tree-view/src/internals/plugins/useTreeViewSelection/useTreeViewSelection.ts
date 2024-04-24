import * as React from 'react';
import { TreeViewPlugin } from '../../models';
import { TreeViewItemId } from '../../../models';
import {
  findOrderInTremauxTree,
  getAllNavigableItems,
  getFirstNavigableItem,
  getLastNavigableItem,
  getNonDisabledItemsInRange,
} from '../../utils/tree';
import { UseTreeViewSelectionSignature } from './useTreeViewSelection.types';
import { convertSelectedItemsToArray, getLookupFromArray } from './useTreeViewSelection.utils';

export const useTreeViewSelection: TreeViewPlugin<UseTreeViewSelectionSignature> = ({
  instance,
  params,
  models,
}) => {
  const lastSelectedItem = React.useRef<string | null>(null);
  const lastSelectedRange = React.useRef<{ [itemId: string]: boolean }>({});

  const selectedItemsMap = React.useMemo(() => {
    const temp = new Map<TreeViewItemId, boolean>();
    if (Array.isArray(models.selectedItems.value)) {
      models.selectedItems.value.forEach((id) => {
        temp.set(id, true);
      });
    } else if (models.selectedItems.value != null) {
      temp.set(models.selectedItems.value, true);
    }

    return temp;
  }, [models.selectedItems.value]);

  const setSelectedItems = (
    event: React.SyntheticEvent,
    newSelectedItems: typeof params.defaultSelectedItems,
  ) => {
    if (params.onItemSelectionToggle) {
      if (params.multiSelect) {
        const addedItems = (newSelectedItems as string[]).filter(
          (itemId) => !instance.isItemSelected(itemId),
        );
        const removedItems = (models.selectedItems.value as string[]).filter(
          (itemId) => !(newSelectedItems as string[]).includes(itemId),
        );

        addedItems.forEach((itemId) => {
          params.onItemSelectionToggle!(event, itemId, true);
        });

        removedItems.forEach((itemId) => {
          params.onItemSelectionToggle!(event, itemId, false);
        });
      } else if (newSelectedItems !== models.selectedItems.value) {
        if (models.selectedItems.value != null) {
          params.onItemSelectionToggle(event, models.selectedItems.value as string, false);
        }
        if (newSelectedItems != null) {
          params.onItemSelectionToggle(event, newSelectedItems as string, true);
        }
      }
    }

    if (params.onSelectedItemsChange) {
      params.onSelectedItemsChange(event, newSelectedItems);
    }

    models.selectedItems.setControlledValue(newSelectedItems);
  };

  const isItemSelected = (itemId: string) => selectedItemsMap.has(itemId);

  const selectItem = (event: React.SyntheticEvent, itemId: string, multiple = false) => {
    if (params.disableSelection) {
      return;
    }

    let newSelected: typeof models.selectedItems.value;
    if (multiple) {
      const cleanSelectedItems = convertSelectedItemsToArray(models.selectedItems.value);
      if (instance.isItemSelected(itemId)) {
        newSelected = cleanSelectedItems.filter((id) => id !== itemId);
      } else {
        newSelected = [itemId].concat(cleanSelectedItems);
      }
    } else {
      newSelected = params.multiSelect ? [itemId] : itemId;
    }

    setSelectedItems(event, newSelected);
    lastSelectedItem.current = itemId;
    lastSelectedRange.current = {};
  };

  const selectRange = (event: React.SyntheticEvent, [start, end]: [string, string]) => {
    if (params.disableSelection || !params.multiSelect) {
      return;
    }

    let newSelectedItems = convertSelectedItemsToArray(models.selectedItems.value).slice();

    // If the last selection was a range selection,
    // remove the items that were part of the last range from the model
    if (Object.keys(lastSelectedRange.current).length > 0) {
      newSelectedItems = newSelectedItems.filter((id) => !lastSelectedRange.current[id]);
    }

    // Add to the model the items that are part of the new range and not already part of the model.
    const selectedItemsLookup = getLookupFromArray(newSelectedItems);
    const range = getNonDisabledItemsInRange(instance, start, end);
    const itemsToAddToModel = range.filter((id) => !selectedItemsLookup[id]);
    newSelectedItems = newSelectedItems.concat(itemsToAddToModel);

    setSelectedItems(event, newSelectedItems);
    lastSelectedRange.current = getLookupFromArray(range);
  };

  const expandSelectionRange = (event: React.SyntheticEvent, itemId: string) => {
    if (lastSelectedItem.current != null) {
      const [start, end] = findOrderInTremauxTree(instance, itemId, lastSelectedItem.current);
      selectRange(event, [start, end]);
    }
  };

  const selectRangeFromStartToItem = (event: React.SyntheticEvent, itemId: string) => {
    selectRange(event, [getFirstNavigableItem(instance), itemId]);
  };

  const selectRangeFromItemToEnd = (event: React.SyntheticEvent, itemId: string) => {
    selectRange(event, [itemId, getLastNavigableItem(instance)]);
  };

  const selectAllNavigableItems = (event: React.SyntheticEvent) => {
    if (params.disableSelection || !params.multiSelect) {
      return;
    }

    const navigableItems = getAllNavigableItems(instance);
    setSelectedItems(event, navigableItems);

    lastSelectedRange.current = getLookupFromArray(navigableItems);
  };

  const selectItemFromArrowNavigation = (
    event: React.SyntheticEvent,
    currentItem: string,
    nextItem: string,
  ) => {
    if (params.disableSelection || !params.multiSelect) {
      return;
    }

    let newSelectedItems = convertSelectedItemsToArray(models.selectedItems.value).slice();

    if (Object.keys(lastSelectedRange.current).length === 0) {
      newSelectedItems.push(nextItem);
      lastSelectedRange.current = { [currentItem]: true, [nextItem]: true };
    } else {
      if (!lastSelectedRange.current[currentItem]) {
        lastSelectedRange.current = {};
      }

      if (lastSelectedRange.current[nextItem]) {
        newSelectedItems = newSelectedItems.filter((id) => id !== currentItem);
        delete lastSelectedRange.current[currentItem];
      } else {
        newSelectedItems.push(nextItem);
        lastSelectedRange.current[nextItem] = true;
      }
    }

    setSelectedItems(event, newSelectedItems);
  };

  return {
    getRootProps: () => ({
      'aria-multiselectable': params.multiSelect,
    }),
    instance: {
      isItemSelected,
      selectItem,
      selectAllNavigableItems,
      expandSelectionRange,
      selectRangeFromStartToItem,
      selectRangeFromItemToEnd,
      selectItemFromArrowNavigation,
    },
    contextValue: {
      selection: {
        multiSelect: params.multiSelect,
      },
    },
  };
};

useTreeViewSelection.models = {
  selectedItems: {
    getDefaultValue: (params) => params.defaultSelectedItems,
  },
};

const DEFAULT_SELECTED_ITEMS: string[] = [];

useTreeViewSelection.getDefaultizedParams = (params) => ({
  ...params,
  disableSelection: params.disableSelection ?? false,
  multiSelect: params.multiSelect ?? false,
  defaultSelectedItems:
    params.defaultSelectedItems ?? (params.multiSelect ? DEFAULT_SELECTED_ITEMS : null),
});

useTreeViewSelection.params = {
  disableSelection: true,
  multiSelect: true,
  defaultSelectedItems: true,
  selectedItems: true,
  onSelectedItemsChange: true,
  onItemSelectionToggle: true,
};
