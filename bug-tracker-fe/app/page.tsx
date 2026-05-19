'use client';

import { FormEvent, useState } from 'react';

type FormData = {
  title: string;
  description: string;
  stepsToReproduce: string;
  reporterEmail: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const initialFormData: FormData = {
  title: '',
  description: '',
  stepsToReproduce: '',
  reporterEmail: '',
};

export default function Home() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required.';
    }

    if (
      formData.reporterEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.reporterEmail)
    ) {
      newErrors.reporterEmail = 'Enter a valid email address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: '',
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (!validateForm()) {
      setMessage('Please fix the highlighted fields before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(`${apiUrl}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          stepsToReproduce: formData.stepsToReproduce.trim() || null,
          reporterEmail: formData.reporterEmail.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(
          data?.error ||
            'Your bug report could not be submitted. Please check the form and try again.'
        );
        return;
      }

      setFormData(initialFormData);
      setErrors({});
      setMessage('Bug report submitted successfully. Thank you!');
    } catch {
      setMessage(
        'Network error: the API may be down right now. Your text is still here, so you can try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white">
      <section className="mx-auto max-w-3xl border border-zinc-800 bg-zinc-950 p-10 shadow-2xl">
        <div className="mb-10 border-b border-zinc-800 pb-8">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-zinc-400">
            TCSS 460 Bug Tracker
          </p>

          <h1
            className="text-6xl font-light tracking-tight text-white"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Report a Bug
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-400">
            Found an issue with our API or website? Fill out the form below and our team will review
            it as soon as possible.
          </p>
        </div>

        {message && (
          <div className="mb-8 border border-zinc-700 bg-zinc-900 px-5 py-4 text-sm text-zinc-300">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          <div>
            <label
              htmlFor="title"
              className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300"
            >
              Bug Title *
            </label>

            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(event) => updateField('title', event.target.value)}
              className="w-full border border-zinc-700 bg-black px-5 py-4 text-lg text-white outline-none transition focus:border-white"
              placeholder="Example: Search page crashes after submit"
            />

            {errors.title && <p className="mt-2 text-sm text-red-400">{errors.title}</p>}
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300"
            >
              Description *
            </label>

            <textarea
              id="description"
              value={formData.description}
              onChange={(event) => updateField('description', event.target.value)}
              className="min-h-44 w-full border border-zinc-700 bg-black px-5 py-4 text-lg text-white outline-none transition focus:border-white"
              placeholder="Describe what happened and what you expected instead."
            />

            {errors.description && (
              <p className="mt-2 text-sm text-red-400">{errors.description}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="stepsToReproduce"
              className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300"
            >
              Steps To Reproduce
            </label>

            <textarea
              id="stepsToReproduce"
              value={formData.stepsToReproduce}
              onChange={(event) => updateField('stepsToReproduce', event.target.value)}
              className="min-h-36 w-full border border-zinc-700 bg-black px-5 py-4 text-lg text-white outline-none transition focus:border-white"
              placeholder="1. Open page&#10;2. Click submit&#10;3. Observe error"
            />
          </div>

          <div>
            <label
              htmlFor="reporterEmail"
              className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300"
            >
              Contact Email
            </label>

            <input
              id="reporterEmail"
              type="email"
              value={formData.reporterEmail}
              onChange={(event) => updateField('reporterEmail', event.target.value)}
              className="w-full border border-zinc-700 bg-black px-5 py-4 text-lg text-white outline-none transition focus:border-white"
              placeholder="you@example.com"
            />

            {errors.reporterEmail && (
              <p className="mt-2 text-sm text-red-400">{errors.reporterEmail}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full border border-white bg-white px-6 py-5 text-sm font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {isSubmitting ? 'Submitting Bug Report...' : 'Submit Bug Report'}
          </button>
        </form>
      </section>
    </main>
  );
}
