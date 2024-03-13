import * as React from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem2, TreeItem2Label } from '@mui/x-tree-view/TreeItem2';

function CustomLabel(props) {
  const { tooltip, ...other } = props;

  return (
    <Tooltip title={tooltip}>
      <TreeItem2Label {...other} />
    </Tooltip>
  );
}

const CustomTreeItem = React.forwardRef((props, ref) => {
  const { labelTooltip, ...other } = props;

  return (
    <TreeItem2
      {...other}
      ref={ref}
      slots={{ label: CustomLabel }}
      slotProps={{ label: { tooltip: labelTooltip } }}
    />
  );
});

export default function LabelSlots() {
  return (
    <Box sx={{ height: 220, flexGrow: 1, maxWidth: 400 }}>
      <SimpleTreeView defaultExpandedItems={['pickers']}>
        <CustomTreeItem nodeId="grid" label="Data Grid">
          <CustomTreeItem
            nodeId="grid-community"
            label="@mui/x-data-grid"
            labelTooltip="Community version (MIT) of the Data Grid"
          />
          <CustomTreeItem
            nodeId="grid-pro"
            label="@mui/x-data-grid-pro"
            labelTooltip="Pro version (commercial) of the Data Grid"
          />
          <CustomTreeItem
            nodeId="grid-premium"
            label="@mui/x-data-grid-premium"
            labelTooltip="Premium version (commercial) of the Data Grid"
          />
        </CustomTreeItem>
        <CustomTreeItem nodeId="pickers" label="Date and Time Pickers">
          <CustomTreeItem
            nodeId="pickers-community"
            label="@mui/x-date-pickers"
            labelTooltip="Community version (MIT) of the Date and Time Pickers"
          />
          <CustomTreeItem
            nodeId="pickers-pro"
            label="@mui/x-date-pickers-pro"
            labelTooltip="Pro version (commercial) of the Date and Time Pickers"
          />
        </CustomTreeItem>
      </SimpleTreeView>
    </Box>
  );
}