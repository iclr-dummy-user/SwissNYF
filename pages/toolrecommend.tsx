// pages/index.tsx

import React from 'react';
import ToolRecommenderInterface from "@/components/Chat/ToolRecommender/ToolRecommenderInterface";
import ToolRecommenderDialog from "@/components/Chat/ToolRecommender/ToolRecommenderDialog";
import { Tool } from '@/types/chat';
import {Button} from "@mui/material";
const tools = [
  { name: 'Tool 1', description: 'Description 1' },
  { name: 'Tool 2', description: 'Description 2' },
  { name: 'Tool 3', description: 'Description 3' },
  { name: 'Tool 4', description: 'Description 4' },
  { name: 'Tool 5', description: 'Description 5' },
  { name: 'Tool 6', description: 'Description 6' },
  { name: 'Tool 7', description: 'Description 7' },
  { name: 'Tool 8', description: 'Description 8' },
  { name: 'Tool 9', description: 'Description 9' },
  { name: 'Tool 10', description: 'Description 10' },
  { name: 'Tool 11', description: 'Description 11' },
  { name: 'Tool 12', description: 'Description 12' },
] as Tool[];

const HomePage: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <h1>Welcome to the Tool Recommender</h1>
      <Button variant="contained" onClick={handleOpen}>
        Open Tool Recommender
      </Button>
      <ToolRecommenderDialog tools={tools} open={open} onClose={handleClose} />
    </div>
  );
};

export default HomePage;
