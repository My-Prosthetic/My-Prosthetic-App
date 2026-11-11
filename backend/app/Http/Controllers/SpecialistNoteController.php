<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListSpecialistNotesRequest;
use App\Http\Requests\StoreSpecialistNoteRequest;
use App\Http\Resources\SpecialistNoteResource;
use App\Models\SpecialistNote;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class SpecialistNoteController extends Controller
{
    public function index(ListSpecialistNotesRequest $request, User $patient): AnonymousResourceCollection
    {
        $notes = SpecialistNote::query()
            ->visibleTo($this->actor($request), $patient)
            ->when($request->validated('type'), fn (Builder $query, string $type) => $query->where('type', $type))
            ->with('author')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->cursorPaginate(20)
            ->withQueryString();

        return SpecialistNoteResource::collection($notes);
    }

    public function store(StoreSpecialistNoteRequest $request, User $patient): JsonResponse
    {
        $note = $patient->specialistNotes()->make($request->validated());
        $note->author()->associate($this->actor($request));
        $note->save();

        return SpecialistNoteResource::make($note)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    private function actor(Request $request): User
    {
        $user = $request->user();

        abort_unless($user instanceof User, Response::HTTP_UNAUTHORIZED);

        return $user;
    }
}
