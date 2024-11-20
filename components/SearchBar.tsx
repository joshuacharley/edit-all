import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Tag, Filter } from 'lucide-react';
import { useDocumentStore } from '@/store/documentStore';
import debounce from 'lodash/debounce';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { searchDocuments } = useDocumentStore();

  const debouncedSearch = useCallback(
    debounce((searchQuery: string, searchTags: string[]) => {
      searchDocuments(searchQuery, { tags: searchTags });
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query, tags);
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, tags, debouncedSearch]);

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md">
          {tags.map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full"
            >
              <Tag className="h-3 w-3" />
              <span className="text-sm">{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          ))}
          <Input
            placeholder="Add tag..."
            className="w-24 h-7"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddTag((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
