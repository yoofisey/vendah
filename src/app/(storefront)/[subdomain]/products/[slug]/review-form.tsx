"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { submitReview } from "./review-actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-charcoal/15 bg-cream px-4 py-2.5 text-sm text-charcoal transition duration-200 placeholder:text-muted focus:border-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/30";

export function ReviewForm({
  tenantId,
  productId,
}: {
  tenantId: string;
  productId: string;
}) {
  const [state, action, pending] = useActionState(submitReview, {});
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  if (state.success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-sm text-green-800">
        Thanks for your review! Refresh to see it live on this product.
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <span className="block text-sm font-medium">Your rating</span>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(value)}
              className="p-0.5 transition duration-100 hover:scale-110"
            >
              <StarIcon
                className={`h-7 w-7 ${
                  (hover || rating) >= value
                    ? "text-gold"
                    : "text-charcoal/15"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="customerName" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="customerName"
          name="customerName"
          required
          minLength={2}
          maxLength={80}
          placeholder="Your name"
          className={`${inputClass}`}
        />
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium">
          Review
        </label>
        <textarea
          id="comment"
          name="comment"
          required
          minLength={3}
          maxLength={1000}
          rows={4}
          placeholder="What did you think of this product?"
          className={`${inputClass}`}
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || rating === 0}
        className="rounded-lg bg-pine px-6 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
