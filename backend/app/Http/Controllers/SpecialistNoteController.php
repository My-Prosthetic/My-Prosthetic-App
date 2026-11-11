<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSpecialistNoteRequest;
use App\Http\Resources\SpecialistNoteResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SpecialistNoteController extends Controller
{
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
