<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\StoreWalletEntryRequest;
use App\Http\Resources\WalletEntryResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class WalletEntryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $patient = $this->authenticatedPatient($request);

        return WalletEntryResource::collection(
            $patient->walletEntries()
                ->latest('assigned_at')
                ->latest('created_at')
                ->get(),
        );
    }

    public function store(StoreWalletEntryRequest $request): JsonResponse
    {
        $patient = $this->authenticatedPatient($request);
        $validated = $request->validated();

        $entry = $patient->walletEntries()->create([
            'source' => $validated['source'],
            'amount' => $validated['amount'],
            'assigned_at' => $validated['date'],
            'note' => $validated['note'] ?? null,
        ]);

        return WalletEntryResource::make($entry)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    private function authenticatedPatient(Request $request): User
    {
        $user = $request->user();

        abort_unless(
            $user instanceof User && $user->role === UserRole::PATIENT,
            Response::HTTP_FORBIDDEN,
        );

        return $user;
    }
}
