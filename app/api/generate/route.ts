import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { grade, topic, name } = await req.json();

    const [storyCompletion, imageResponse] = await Promise.all([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a children's book author." },
          { role: "user", content: `Write a short 300-word educational story for a ${grade} student about ${topic}. The main character is a child named ${name}. Keep it engaging and fun.` }
        ],
      }),
      
      openai.images.generate({
        model: "dall-e-3",
        prompt: `A warm, colorful children's book illustration of a child named ${name} learning about ${topic}. Artistic style, high quality, vibrant.`,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json", // <--- THIS IS THE MAGIC FIX
      })
    ]);

    const storyText = storyCompletion.choices[0].message.content || "No story generated.";
    // We convert the raw code into a browser-readable image string
    const imageBase64 = imageResponse.data[0].b64_json; 
    const finalImage = `data:image/png;base64,${imageBase64}`;

    // Save to Supabase (Note: Storing base64 is heavy, for MVP it's fine, but normally we'd upload to Storage)
    // We will strip the base64 for saving to DB to keep it light, or just save "Image generated" text for now 
    // since Supabase text columns have limits. 
    // For a real app, we would upload this to Supabase Storage.
    // Let's just save the metadata for now so the DB doesn't crash.
    
    const { error } = await supabase
      .from('stories')
      .insert([
        { 
          grade_level: grade, 
          topic: topic, 
          child_name: name, 
          story_text: storyText,
          image_url: "Image saved locally" // Placeholder since we aren't using Storage buckets yet
        }
      ]);

    if (error) throw error;

    return NextResponse.json({ success: true, story: storyText, imageUrl: finalImage });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate content' }, { status: 500 });
  }
}