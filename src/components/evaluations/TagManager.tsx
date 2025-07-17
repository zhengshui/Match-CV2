"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Tag, 
  Edit2, 
  Trash2, 
  Filter,
  X
} from "lucide-react";

interface TagData {
  id: string;
  name: string;
  color?: string;
  category: string;
  count?: number; // Number of resumes with this tag
}

interface TagManagerProps {
  tags: TagData[];
  selectedTags?: string[];
  onTagSelect?: (tagId: string) => void;
  onTagDeselect?: (tagId: string) => void;
  onCreateTag?: (tag: Omit<TagData, 'id' | 'count'>) => void;
  onUpdateTag?: (tagId: string, updates: Partial<TagData>) => void;
  onDeleteTag?: (tagId: string) => void;
  mode?: 'management' | 'selection';
  showCounts?: boolean;
}

const TAG_CATEGORIES = [
  { value: 'SKILL', label: 'Skill' },
  { value: 'EXPERIENCE', label: 'Experience' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'CERTIFICATION', label: 'Certification' },
  { value: 'INDUSTRY', label: 'Industry' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'CUSTOM', label: 'Custom' },
];

const TAG_COLORS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Yellow' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#84CC16', label: 'Lime' },
  { value: '#F97316', label: 'Orange' },
];

export function TagManager({ 
  tags, 
  selectedTags = [],
  onTagSelect,
  onTagDeselect,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  mode = 'management',
  showCounts = true
}: TagManagerProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  
  // Create tag form state
  const [newTagName, setNewTagName] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('CUSTOM');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  // Filter tags based on category and search
  const filteredTags = tags.filter(tag => {
    const matchesCategory = filterCategory === 'all' || tag.category === filterCategory;
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group tags by category
  const tagsByCategory = filteredTags.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category]?.push(tag);
    return acc;
  }, {} as Record<string, TagData[]>);

  const handleCreateTag = () => {
    if (!newTagName.trim() || !onCreateTag) return;
    
    onCreateTag({
      name: newTagName.trim(),
      category: newTagCategory,
      color: newTagColor,
    });

    // Reset form
    setNewTagName('');
    setNewTagCategory('CUSTOM');
    setNewTagColor('#3B82F6');
    setIsCreateDialogOpen(false);
  };

  const handleUpdateTag = () => {
    if (!editingTag || !onUpdateTag) return;
    
    onUpdateTag(editingTag.id, {
      name: newTagName,
      category: newTagCategory,
      color: newTagColor,
    });

    setEditingTag(null);
    setNewTagName('');
    setNewTagCategory('CUSTOM');
    setNewTagColor('#3B82F6');
  };

  const startEditTag = (tag: TagData) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagCategory(tag.category);
    setNewTagColor(tag.color ?? '#3B82F6');
  };

  const handleTagClick = (tag: TagData) => {
    if (mode === 'selection') {
      if (selectedTags.includes(tag.id)) {
        onTagDeselect?.(tag.id);
      } else {
        onTagSelect?.(tag.id);
      }
    }
  };

  const getTagStyle = (tag: TagData, isSelected = false) => {
    const baseClasses = "cursor-pointer transition-all duration-200";
    
    if (mode === 'selection') {
      if (isSelected) {
        return `${baseClasses} ring-2 ring-blue-500 ring-offset-2`;
      }
      return `${baseClasses} hover:ring-2 hover:ring-gray-300 hover:ring-offset-1`;
    }
    
    return baseClasses;
  };

  const CategoryHeader = ({ category }: { category: string }) => {
    const categoryLabel = TAG_CATEGORIES.find(c => c.value === category)?.label || category;
    const categoryTags = tagsByCategory[category] || [];
    
    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <Tag className="h-4 w-4" />
          {categoryLabel} ({categoryTags.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {categoryTags.map(tag => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <div
                key={tag.id}
                className={`flex items-center gap-1 ${getTagStyle(tag, isSelected)}`}
                onClick={() => handleTagClick(tag)}
              >
                <Badge
                  variant={isSelected ? "default" : "secondary"}
                  className="flex items-center gap-1"
                  style={{ 
                    backgroundColor: isSelected ? tag.color : undefined,
                    borderColor: tag.color 
                  }}
                >
                  {tag.color && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                  {tag.name}
                  {showCounts && tag.count !== undefined && (
                    <span className="ml-1 text-xs">({tag.count})</span>
                  )}
                </Badge>
                
                {mode === 'management' && (
                  <div className="flex gap-1 ml-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        startEditTag(tag);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onDeleteTag?.(tag.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {mode === 'management' ? 'Tag Management' : 'Filter by Tags'}
          </CardTitle>
          
          {mode === 'management' && onCreateTag && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Tag</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tag-name">Tag Name</Label>
                    <Input
                      id="tag-name"
                      value={newTagName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTagName(e.target.value)}
                      placeholder="Enter tag name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tag-category">Category</Label>
                    <Select value={newTagCategory} onValueChange={setNewTagCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAG_CATEGORIES.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tag-color">Color</Label>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {TAG_COLORS.map(color => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 ${
                            newTagColor === color.value ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setNewTagColor(color.value)}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleCreateTag}>Create Tag</Button>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TAG_CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {mode === 'selection' && selectedTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Selected:</span>
              {selectedTags.map(tagId => {
                const tag = tags.find(t => t.id === tagId);
                if (!tag) return null;
                
                return (
                  <Badge key={tagId} variant="default" className="flex items-center gap-1">
                    {tag.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => onTagDeselect?.(tagId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectedTags.forEach(tagId => onTagDeselect?.(tagId))}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Tags by Category */}
        <div className="space-y-6">
          {Object.keys(tagsByCategory).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tags found matching your criteria.
            </div>
          ) : (
            Object.keys(tagsByCategory).map(category => (
              <CategoryHeader key={category} category={category} />
            ))
          )}
        </div>

        {/* Edit Tag Dialog */}
        {editingTag && (
          <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Tag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-tag-name">Tag Name</Label>
                  <Input
                    id="edit-tag-name"
                    value={newTagName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTagName(e.target.value)}
                    placeholder="Enter tag name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-tag-category">Category</Label>
                  <Select value={newTagCategory} onValueChange={setNewTagCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAG_CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-tag-color">Color</Label>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {TAG_COLORS.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          newTagColor === color.value ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setNewTagColor(color.value)}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleUpdateTag}>Update Tag</Button>
                  <Button variant="outline" onClick={() => setEditingTag(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}