
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/data';
import { toast } from 'sonner';

interface CommentFormProps {
  postId: string;
  currentUser: User;
  onCommentAdded: (content: string) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ postId, currentUser, onCommentAdded }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call delay
    setTimeout(() => {
      onCommentAdded(content);
      setContent('');
      setIsSubmitting(false);
      toast.success('Comment posted successfully');
    }, 500);
  };

  return (
    <div className="p-4 border-b border-xExtraLightGray">
      <div className="flex">
        <div className="mr-3 flex-shrink-0">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
        
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className="w-full min-h-[80px] mb-3 p-3 border border-xExtraLightGray focus:border-xBlue rounded-lg resize-none"
            />
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!content.trim() || isSubmitting}
                className={`px-4 py-2 rounded-full bg-xBlue text-white ${isSubmitting ? 'opacity-70' : 'hover:bg-opacity-90'}`}
              >
                {isSubmitting ? 'Posting...' : 'Reply'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentForm;
