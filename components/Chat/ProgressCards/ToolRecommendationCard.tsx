import * as React from 'react';
import {styled} from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import IconButton, {IconButtonProps} from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import {red} from '@mui/material/colors';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Box from '@mui/material/Box';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BuildIcon from '@mui/icons-material/Build';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import Button from "@mui/material/Button";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {TransitionProps} from '@mui/material/transitions';
import {LLMUsage, ToolUsage, ToolRecommendation} from "@/types/chat";
import ToolRecommenderInterface from "@/components/Chat/ToolRecommender/ToolRecommenderInterface";
import ToolRecommenderDialog from "@/components/Chat/ToolRecommender/ToolRecommenderDialog";
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import {CircularProgress} from "@mui/material";

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

// const Transition = React.forwardRef(function Transition(
//   props: TransitionProps & {
//     children: React.ReactElement<any, any>;
//   },
//   ref: React.Ref<unknown>,
// ) {
//   return <Slide direction="up" ref={ref} {...props} />;
// });

interface ToolProgressCardProps {
  data: ToolRecommendation,
  children?: React.ReactNode
}

const summarizeToolUsage = (toolUsage: ToolRecommendation) => {
  var recommendations = toolUsage.recommendations;
  // var summary = "Using tools: ";
  var summary = "";
  // if (!recommendations) return "Not available yet"
  if (recommendations.length == 0) {
    return "";
  }
  for (var i = 0; i < recommendations.length; i++) {
    var tool_name = recommendations[i].name;
    if (i == recommendations.length - 1) {
      summary += tool_name;
    } else {
      summary += tool_name + ", ";
    }
  }
  return summary;
}

const ToolProgressCard = (props: ToolProgressCardProps) => {
  const [recommendationDialogOpen, setRecommendationDialogOpen] = React.useState(false);
  var data = props.data;
  // const handleExpandClick = () => {
  //   setExpanded(!expanded);
  // };

  const handleRecommendationOpen = () => {
    setRecommendationDialogOpen(true);
  }

  const handleRecommendationClose = () => {
    setRecommendationDialogOpen(false);
  }

  const toolSummary = summarizeToolUsage(data);

  const setExpandProgressIcon = (loading: boolean) => {
    if (loading) {
      return <CircularProgress />
    } else {
      return <IconButton aria-label="settings" onClick={handleRecommendationOpen}>
        <OpenInFullIcon/>
      </IconButton>
    }
  }
  if (!props.data.recommendations) props.data.recommendations = [];
  return (
    <Box sx={{
      // set margin left
      m:0
    }}>
      <Card sx={{
        // set background color
        bgcolor: '#',
        //set min width
        minWidth: '500px',
        // set max width
        maxWidth: '500px',
      }}>
        <CardHeader
          avatar={
            <BuildIcon/>
          }
          action={
            setExpandProgressIcon(props.data.recommendations.length==0)
          }
          title={
            <>
              <Typography paragraph sx={{
                m:0
              }}>
                {/*Make first part bold and second part normal*/}
                <span style={{ fontWeight: 'bold' }}>Tool Recommendations: </span> {toolSummary ?
                  (toolSummary.length > 20 ? toolSummary.substring(0, 20) + "..." : toolSummary)
                  : "Not available"}
              </Typography>
            </>
          }
          subheader={<></>
          }
          sx={{
            textAlign: 'left',
          }}
          disableTypography
        />
        <ToolRecommenderDialog tools={data.recommendations} open={recommendationDialogOpen}
                               onClose={handleRecommendationClose}/>
      </Card>
    </Box>
  );
}

export default ToolProgressCard;