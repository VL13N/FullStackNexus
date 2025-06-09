import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface FeedbackWidgetProps {
  predictionId: string;
  confidence: number;
  category: string;
  onFeedbackSubmit?: (feedback: any) => void;
}

export default function FeedbackWidget({ 
  predictionId, 
  confidence, 
  category, 
  onFeedbackSubmit 
}: FeedbackWidgetProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = async () => {
    const feedbackData = {
      predictionId,
      confidence,
      category,
      helpful: feedback === 'helpful',
      comment: comment.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      await fetch('/api/feedback/prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });

      setSubmitted(true);
      onFeedbackSubmit?.(feedbackData);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm">Thank you for your feedback!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Was this prediction helpful?
          <Badge variant="outline" className="ml-auto">
            {confidence}% confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            variant={feedback === 'helpful' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedback('helpful')}
            className="flex-1"
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Helpful
          </Button>
          <Button
            variant={feedback === 'not-helpful' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeedback('not-helpful')}
            className="flex-1"
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            Not Helpful
          </Button>
        </div>
        
        {feedback && (
          <div className="space-y-2">
            <Textarea
              placeholder="Optional: Tell us how we can improve predictions..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <Button 
              onClick={submitFeedback}
              size="sm"
              className="w-full"
            >
              Submit Feedback
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}