import { supabase } from '@/services/supabase';
import { Article } from '@/types/database';

export const articleService = {
  async getArticles(): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }

    return data || [];
  },

  async getFeaturedArticles(): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('featured', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured articles:', error);
      throw error;
    }

    return data || [];
  }
};
