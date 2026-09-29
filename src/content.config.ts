import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			topics: z.array(z.string()),
			featured: z.boolean().default(false),
            kind: z.enum(['note', 'research']).default('note'),
            researchQuestion: z.string().optional(),
            method: z.string().optional(),
            evaluation: z.string().optional(),
            project: z.string().optional(),
            status: z.enum(['Technical note', 'Draft proposal', 'Essay', 'Case study']).default('Technical note'),
		}),
});

export const collections = { blog };
