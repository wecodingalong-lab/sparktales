'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { StoryPDF } from './components/StoryPDF'; // Import our new PDF layout

// TRICK: We must import the PDFDownloadLink dynamically to avoid "Window not found" errors
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => <button className="px-4 py-2 bg-gray-200 rounded text-gray-500">Loading PDF...</button>,
  }
);

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  // We save the input data to use as the PDF Title
  const [inputData, setInputData] = useState({ name: '', grade: '', topic: '' });

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setStory(''); 
    setImageUrl(''); 
    
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name') as string,
      grade: formData.get('grade') as string,
      topic: formData.get('topic') as string,
    };
    setInputData(data); // Save for the PDF title

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setStory(result.story);
      setImageUrl(result.imageUrl);
    } catch (error) {
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 p-8 font-sans">
      <main className="max-w-2xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-extrabold text-orange-600 tracking-tight">SparkTales ✨</h1>
          <p className="text-gray-600 text-lg">Create magical educational stories in seconds.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-orange-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Child's Name</label>
              <input name="name" required className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none transition" placeholder="e.g. Leo" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Grade Level</label>
                <select name="grade" className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none bg-white">
                  <option>Kindergarten</option>
                  <option>1st Grade</option>
                  <option>2nd Grade</option>
                  <option>3rd Grade</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Topic</label>
                <input name="topic" required className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none transition" placeholder="e.g. Dinosaurs" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-orange-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? '🎨 Painting & Writing...' : 'Generate Story & Art 🚀'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {(story || imageUrl) && (
          <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-orange-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* NEW: Download Button Area */}
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-3xl font-bold text-orange-800">Your Story</h2>
               
               {/* The Magic PDF Button */}
               <PDFDownloadLink
                 document={<StoryPDF story={story} imageUrl={imageUrl} title={`${inputData.name}'s Adventure in ${inputData.topic}`} />}
                 fileName={`${inputData.name}_Story.pdf`}
                 className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-2"
               >
                 {({ blob, url, loading, error }) => 
                   loading ? 'Preparing PDF...' : '📄 Download PDF'
                 }
               </PDFDownloadLink>
            </div>

            {imageUrl && (
              <div className="mb-8 rounded-xl overflow-hidden shadow-lg border-4 border-orange-200">
                <img src={imageUrl} alt="Story cover" className="w-full h-auto object-cover" />
              </div>
            )}

            <div className="prose prose-lg prose-orange max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {story}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}