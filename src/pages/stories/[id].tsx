import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { Layout } from '../../components/Layout';
import { StoryView } from '../../components/StoryView';
import { stories } from '../../data/stories';
import styles from '../../styles/StoryPage.module.css';

interface StoryPageProps {
  story: typeof stories[0] | null;
}

const StoryPage = ({ story }: StoryPageProps) => {
  const router = useRouter();
  
  // If the page is still being generated, show loading state
  if (router.isFallback) {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading story...</p>
        </div>
      </Layout>
    );
  }
  
  // If story not found
  if (!story) {
    return (
      <Layout title="Story Not Found">
        <div className={styles.errorContainer}>
          <h1 className={styles.errorTitle}>Story Not Found</h1>
          <p className={styles.errorMessage}>
            The story you are looking for does not exist.
          </p>
          <button 
            className={styles.backButton}
            onClick={() => router.push('/stories')}
          >
            Back to Stories
          </button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout
      title={`${story.title.english} | Arabic Stories`}
      description={`Read ${story.title.english} in Arabic with word-by-word translations`}
    >
      <StoryView story={story} />
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = stories.map(story => ({
    params: { id: story.id }
  }));
  
  return {
    paths,
    fallback: false
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const storyId = params?.id as string;
  const story = stories.find(s => s.id === storyId) || null;
  
  return {
    props: {
      story
    }
  };
};

export default StoryPage; 