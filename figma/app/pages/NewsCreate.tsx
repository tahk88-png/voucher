import { useState, useEffect } from 'react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { RichTextEditor } from '@app/components/RichTextEditor';
import { useNavigate } from '@/lib/router-shim';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Settings, 
  Eye, 
  Calendar,
  Globe,
  User,
  Tag,
  AlertCircle
} from 'lucide-react';
import { Input } from '@app/components/ui/input';
import { Label } from '@app/components/ui/label';
import { Textarea } from '@app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@app/components/ui/select';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

type Step = 1 | 2 | 3 | 4;

export function NewsCreate() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'news',
    tags: '',
    author: 'Admin',
    publishDate: new Date().toISOString().split('T')[0],
    status: 'draft',
    seoTitle: '',
    seoDescription: '',
    featuredImage: null as File | null,
  });

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title]);

  const steps = [
    { number: 1, label: 'Content', icon: FileText },
    { number: 2, label: 'Media', icon: ImageIcon },
    { number: 3, label: 'Settings', icon: Settings },
    { number: 4, label: 'Preview', icon: Eye },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, featuredImage: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, featuredImage: null }));
    setImagePreview(null);
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        if (!formData.title) {
          toast.error('Please enter a title');
          return false;
        }
        if (!formData.content) {
            toast.error('Please write some content');
            return false;
        }
        return true;
      case 2:
        // Image is optional but recommended
        return true;
      case 3:
        if (!formData.publishDate) {
          toast.error('Please select a publish date');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep((prev) => (prev + 1) as Step);
      } else {
        handleCreate();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    } else {
      navigate('/dashboard'); // Or back to news list if it exists
    }
  };

  const handleCreate = () => {
    toast.success('Article published successfully!');
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-[#FFF9ED] rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[#6B5744]" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[#2D2721]">Create Article</h1>
          <p className="text-[#6B5744] mt-1">Share news, updates, or stories with your audience</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Steps (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stepper */}
          <WarmCard padding="md">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;

                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1 relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] shadow-warm scale-110'
                            : isCompleted
                            ? 'bg-[#9DB5A5] text-white'
                            : 'bg-[#F2EDE3] text-[#8B7355]'
                        }`}
                      >
                        {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          isActive ? 'text-[#2D2721]' : 'text-[#8B7355]'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-4 transition-colors duration-500 ${
                          isCompleted ? 'bg-[#9DB5A5]' : 'bg-[#F2EDE3]'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </WarmCard>

          {/* Step Content */}
          <WarmCard padding="lg" className="min-h-[600px]">
             <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-[#2D2721] mb-1">Content Details</h3>
                      <p className="text-[#6B5744]">Write the main content of your article</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Article Title *</Label>
                        <Input
                          id="title"
                          placeholder="e.g., New Features Announcement"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          className="mt-1.5 text-lg font-medium"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                              id="slug"
                              value={formData.slug}
                              onChange={(e) => handleInputChange('slug', e.target.value)}
                              className="mt-1.5 font-mono text-sm text-[#6B5744]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="category">Category</Label>
                            <Select 
                              value={formData.category} 
                              onValueChange={(val) => handleInputChange('category', val)}
                            >
                              <SelectTrigger className="mt-1.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="news">News</SelectItem>
                                <SelectItem value="blog">Blog</SelectItem>
                                <SelectItem value="update">Update</SelectItem>
                                <SelectItem value="promotion">Promotion</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                      </div>

                      <div>
                        <Label htmlFor="excerpt">Short Excerpt</Label>
                        <Textarea
                          id="excerpt"
                          placeholder="Brief summary of the article..."
                          value={formData.excerpt}
                          onChange={(e) => handleInputChange('excerpt', e.target.value)}
                          className="mt-1.5 h-20"
                        />
                        <p className="text-xs text-[#8B7355] mt-1">Shown in list views and search results.</p>
                      </div>

                      <div>
                        <Label htmlFor="content">Full Content *</Label>
                        <div className="mt-1.5">
                          <RichTextEditor
                            content={formData.content}
                            onChange={(content) => handleInputChange('content', content)}
                            placeholder="Start writing your story..."
                            className="min-h-[400px]"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-[#2D2721] mb-1">Visual Media</h3>
                      <p className="text-[#6B5744]">Add a featured image to make your article pop</p>
                    </div>

                    <div className="space-y-4">
                        <Label>Featured Image</Label>
                        <div className="border-2 border-dashed border-[#E7DCC7] rounded-xl p-8 text-center hover:border-[#FFC857] transition-colors bg-[#FFFBF5]">
                          <input
                            type="file"
                            id="image"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                          {!imagePreview ? (
                            <label htmlFor="image" className="cursor-pointer flex flex-col items-center">
                              <div className="w-16 h-16 bg-[#FFF9ED] rounded-full flex items-center justify-center mb-4 text-[#FFC857]">
                                <Upload className="h-8 w-8" />
                              </div>
                              <span className="text-lg font-medium text-[#2D2721] mb-1">Click to upload cover image</span>
                              <span className="text-sm text-[#8B7355]">Recommended size: 1200x630px</span>
                            </label>
                          ) : (
                            <div className="relative w-full max-w-2xl mx-auto">
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="w-full h-auto max-h-[400px] object-cover rounded-xl shadow-warm"
                              />
                              <button
                                onClick={handleImageRemove}
                                className="absolute -top-3 -right-3 p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                        </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-[#2D2721] mb-1">Publishing Settings</h3>
                      <p className="text-[#6B5744]">Configure meta data and visibility</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="author">Author</Label>
                        <Select 
                          value={formData.author} 
                          onValueChange={(val) => handleInputChange('author', val)}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Editor">Editor</SelectItem>
                            <SelectItem value="Guest">Guest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="publishDate">Publish Date</Label>
                        <Input
                          id="publishDate"
                          type="date"
                          value={formData.publishDate}
                          onChange={(e) => handleInputChange('publishDate', e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        placeholder="e.g., technology, update, feature (comma separated)"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        className="mt-1.5"
                      />
                    </div>

                    <div className="pt-4 border-t border-[rgba(139,115,85,0.1)]">
                        <h4 className="font-medium text-[#2D2721] mb-4 flex items-center gap-2">
                            <Globe className="h-4 w-4 text-[#8B7355]" />
                            SEO Settings
                        </h4>
                        
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="seoTitle">Meta Title</Label>
                                <Input
                                id="seoTitle"
                                placeholder={formData.title || "Page Title"}
                                value={formData.seoTitle}
                                onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                                className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label htmlFor="seoDescription">Meta Description</Label>
                                <Textarea
                                id="seoDescription"
                                placeholder={formData.excerpt || "Page Description"}
                                value={formData.seoDescription}
                                onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                                className="mt-1.5 h-24"
                                />
                            </div>
                        </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-[#2D2721] mb-1">Ready to Publish?</h3>
                      <p className="text-[#6B5744]">Review your article one last time</p>
                    </div>

                    <div className="bg-[#FFF9ED] rounded-xl p-6 border border-[#E7DCC7] space-y-4">
                        <div className="flex items-center gap-3 text-[#8B7355] text-sm mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <span>This article will be visible to: <strong>All Users</strong></span>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-b border-[#E7DCC7]/50">
                            <span className="text-[#6B5744]">Status</span>
                            <span className="bg-[#FFC857] text-[#2D2721] px-2 py-0.5 rounded-full text-xs font-medium uppercase">
                                {formData.status}
                            </span>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-b border-[#E7DCC7]/50">
                            <span className="text-[#6B5744]">Publish Date</span>
                            <span className="text-[#2D2721] font-medium">
                                {formData.publishDate}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <span className="text-[#6B5744]">Category</span>
                            <span className="text-[#2D2721] font-medium capitalize">
                                {formData.category}
                            </span>
                        </div>
                    </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </WarmCard>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <WarmButton
              variant="outline"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </WarmButton>

            <WarmButton onClick={handleNext}>
              {currentStep === 4 ? 'Publish Article' : 'Next'}
              {currentStep < 4 ? <ArrowRight className="h-5 w-5 ml-2" /> : <Check className="h-5 w-5 ml-2" />}
            </WarmButton>
          </div>
        </div>

        {/* Right Column: Live Preview (4 cols) */}
        <div className="lg:col-span-4">
           <div className="sticky top-6 space-y-4">
             <div className="flex items-center justify-between text-[#8B7355] px-1">
                <span className="text-xs font-bold tracking-wider uppercase">Live Preview</span>
                <Eye className="h-4 w-4" />
             </div>
             
             {/* Article Preview Card */}
             <div className="w-full bg-white rounded-2xl shadow-warm-lg overflow-hidden border border-[#F2EDE3]">
                {/* Image Area */}
                <div className="w-full h-48 bg-[#F2EDE3] relative overflow-hidden group">
                    {imagePreview ? (
                        <img 
                            src={imagePreview} 
                            alt="Article" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#8B7355] opacity-50 bg-[#FAF7F2]">
                            <ImageIcon className="h-8 w-8 mb-2" />
                            <span className="text-sm">Featured Image</span>
                        </div>
                    )}
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4 bg-[#FFC857] text-[#2D2721] px-3 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wider">
                        {formData.category || 'News'}
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 space-y-4">
                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-[#8B7355] font-medium">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formData.publishDate || 'Today'}
                        </span>
                        <span className="w-1 h-1 bg-[#E7DCC7] rounded-full" />
                        <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {formData.author}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-xl text-[#2D2721] leading-tight line-clamp-3">
                        {formData.title || 'Your Article Title Here'}
                    </h3>
                    
                    {/* Excerpt */}
                    <p className="text-sm text-[#6B5744] leading-relaxed line-clamp-3">
                        {formData.excerpt || 'Write a short excerpt to summarize your article. This will appear in the blog listing...'}
                    </p>

                    {/* Tags */}
                    {formData.tags && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {formData.tags.split(',').map((tag, i) => (
                                <span key={i} className="bg-[#FFF9ED] text-[#8B7355] px-2 py-0.5 rounded text-[10px] uppercase tracking-wide border border-[#E7DCC7]">
                                    #{tag.trim()}
                                </span>
                            ))}
                        </div>
                    )}
                    
                    {/* Read More Link */}
                    <div className="pt-4 mt-2 border-t border-[#F2EDE3] flex items-center text-[#E17B5C] text-sm font-semibold group cursor-pointer">
                        Read full story
                        <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                </div>
             </div>

             {/* SEO Preview Card (Mini) */}
             <div className="bg-white rounded-xl p-4 border border-[#E7DCC7] shadow-sm">
                <h4 className="text-xs font-bold text-[#8B7355] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    Search Result Preview
                </h4>
                <div className="space-y-1 font-sans">
                    <div className="text-[#1a0dab] text-sm hover:underline cursor-pointer truncate">
                        {formData.seoTitle || formData.title || 'Page Title'}
                    </div>
                    <div className="text-[#006621] text-xs truncate">
                        www.example.com/news/{formData.slug || 'article-slug'}
                    </div>
                    <div className="text-[#545454] text-xs line-clamp-2">
                        {formData.seoDescription || formData.excerpt || 'Page description will appear here...'}
                    </div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

