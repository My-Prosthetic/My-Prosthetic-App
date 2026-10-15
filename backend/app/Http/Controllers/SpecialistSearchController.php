<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\SearchSpecialistsRequest;
use App\Http\Resources\SpecialistResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SpecialistSearchController extends Controller
{
    private const RESULT_LIMIT = 20;

    /**
     * Find prosthetists whose search name contains every query word, in any order,
     * or whose Specialist Code equals the whole query.
     */
    public function __invoke(SearchSpecialistsRequest $request): AnonymousResourceCollection
    {
        $words = $request->searchWords();
        $code = $request->specialistCode();

        // Without a word or a code the query would be unconstrained and list everyone.
        if ($words === [] && $code === null) {
            return SpecialistResource::collection([]);
        }

        $specialists = User::query()
            ->where('role', UserRole::PROSTHETIST)
            ->where(function (Builder $query) use ($words, $code): void {
                $query->where(function (Builder $nameMatch) use ($words): void {
                    foreach ($words as $word) {
                        $nameMatch->whereRaw("search_name LIKE ? ESCAPE '!'", ['%'.$this->escapeLike($word).'%']);
                    }
                });

                if ($code !== null) {
                    $query->orWhere('specialist_code', $code);
                }
            })
            ->orderBy('name')
            ->orderBy('id')
            ->limit(self::RESULT_LIMIT)
            ->get(['id', 'name']);

        return SpecialistResource::collection($specialists);
    }

    /**
     * Make LIKE wildcards in user input match literally. The escape character is "!"
     * because PDO before PHP 8.4 misreads a backslash inside SQL string literals.
     */
    private function escapeLike(string $value): string
    {
        return strtr($value, ['!' => '!!', '%' => '!%', '_' => '!_']);
    }
}
