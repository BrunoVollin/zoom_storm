"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReview } from "@/hooks/use-reviews";
import { createReviewSchema, type CreateReviewInput } from "@/schemas/review.schema";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId }: { productId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const createReview = useCreateReview(productId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: { rating: 0 },
  });

  const rating = watch("rating");

  const submit = handleSubmit(async (values) => {
    await createReview.mutateAsync(values, { onSuccess: () => setSubmitted(true) });
  });

  if (submitted) {
    return <p className="text-sm text-muted-foreground">Thanks for your review!</p>;
  }

  return (
    <form onSubmit={submit} className="flex max-w-md flex-col gap-4 rounded-lg border border-border p-4">
      <h3 className="font-medium">Leave your review</h3>

      <div className="flex flex-col gap-1.5">
        <Label>Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              onClick={() => setValue("rating", star, { shouldValidate: true })}
            >
              <Star
                className={cn(
                  "size-6",
                  star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>
        {errors.rating ? <p className="text-sm text-destructive">{errors.rating.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="comment">Comment</Label>
        <Textarea id="comment" rows={3} {...register("comment")} />
        {errors.comment ? <p className="text-sm text-destructive">{errors.comment.message}</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reviewerName">Name</Label>
          <Input id="reviewerName" {...register("reviewerName")} />
          {errors.reviewerName ? (
            <p className="text-sm text-destructive">{errors.reviewerName.message}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reviewerEmail">Email</Label>
          <Input id="reviewerEmail" type="email" {...register("reviewerEmail")} />
          {errors.reviewerEmail ? (
            <p className="text-sm text-destructive">{errors.reviewerEmail.message}</p>
          ) : null}
        </div>
      </div>

      {createReview.isError ? (
        <p className="text-sm text-destructive">
          {createReview.error instanceof Error ? createReview.error.message : "Error submitting review"}
        </p>
      ) : null}

      <Button type="submit" disabled={createReview.isPending} className="w-fit">
        {createReview.isPending ? <Loader2 className="animate-spin" /> : "Submit review"}
      </Button>
    </form>
  );
}
